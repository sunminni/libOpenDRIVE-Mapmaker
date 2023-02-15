#include "ViewerUtils.h"
#include "Math.hpp"
#include "OpenDriveMap.h"
#include "RefLine.h"
#include "Road.h"
#include "Geometries/Line.h"
#include "Geometries/Arc.h"
#include "Geometries/RoadGeometry.h"

#include <iostream>
#include <vector>
#include <cmath>

namespace odr
{

Mesh3D get_refline_segments(const OpenDriveMap& odr_map, double eps)
{
    /* indices are pairs of vertices representing line segments */
    Mesh3D reflines;
    for (const auto& id_road : odr_map.id_to_road)
    {
        const Road&       road = id_road.second;
        if (std::stod(road.id)<0) continue;
        int driving_lane_count = 0;
        for (const auto& s_lanesec : road.s_to_lanesection)
        {
            const LaneSection& lanesec = s_lanesec.second;
            for (const auto& id_lane : lanesec.id_to_lane)
            {
                const Lane&       lane = id_lane.second;
                if (lane.type == "driving"){driving_lane_count++;}
            }
        }

        if (driving_lane_count==0){continue;}
        const std::size_t idx_offset = reflines.vertices.size();

        std::set<double> s_vals = road.ref_line.approximate_linear(eps, 0.0, road.length);
        for (const double& s : s_vals)
        {
            reflines.vertices.push_back(road.ref_line.get_xyz(s));
            reflines.normals.push_back(normalize(road.ref_line.get_grad(s)));
        }

        for (std::size_t idx = idx_offset; idx < (idx_offset + s_vals.size() - 1); idx++)
        {
            reflines.indices.push_back(idx);
            reflines.indices.push_back(idx + 1);
        }
    }

    return reflines;
}

RoadNetworkMesh get_road_network_mesh(const OpenDriveMap& odr_map, double eps)
{
    RoadNetworkMesh  out_mesh;
    LanesMesh&       lanes_mesh = out_mesh.lanes_mesh;
    // RoadmarksMesh&   roadmarks_mesh = out_mesh.roadmarks_mesh;
    // RoadObjectsMesh& road_objects_mesh = out_mesh.road_objects_mesh;

    for (const auto& id_road : odr_map.id_to_road)
    {
        const Road& road = id_road.second;
        if (std::stod(road.id)<0) continue;
        lanes_mesh.road_start_indices[lanes_mesh.vertices.size()] = road.id;
        // roadmarks_mesh.road_start_indices[roadmarks_mesh.vertices.size()] = road.id;
        // road_objects_mesh.road_start_indices[road_objects_mesh.vertices.size()] = road.id;

        for (const auto& s_lanesec : road.s_to_lanesection)
        {
            const LaneSection& lanesec = s_lanesec.second;
            lanes_mesh.lanesec_start_indices[lanes_mesh.vertices.size()] = lanesec.s0;
            // roadmarks_mesh.lanesec_start_indices[roadmarks_mesh.vertices.size()] = lanesec.s0;
            for (const auto& id_lane : lanesec.id_to_lane)
            {
                const Lane&       lane = id_lane.second;
                const std::size_t lanes_idx_offset = lanes_mesh.vertices.size();
                if (lane.type != "driving"){continue;}

                lanes_mesh.lane_start_indices[lanes_idx_offset] = lane.id;
                lanes_mesh.add_mesh(road.get_lane_mesh(lane, eps));

                // std::size_t roadmarks_idx_offset = roadmarks_mesh.vertices.size();
                // roadmarks_mesh.lane_start_indices[roadmarks_idx_offset] = lane.id;
                // const std::vector<RoadMark> roadmarks = lane.get_roadmarks(lanesec.s0, road.get_lanesection_end(lanesec));
                // for (const RoadMark& roadmark : roadmarks)
                // {
                //     roadmarks_idx_offset = roadmarks_mesh.vertices.size();
                //     roadmarks_mesh.roadmark_type_start_indices[roadmarks_idx_offset] = roadmark.type;
                //     roadmarks_mesh.add_mesh(road.get_roadmark_mesh(lane, roadmark, eps));
                // }
            }
        }

        // for (const auto& id_road_object : road.id_to_object)
        // {
        //     const RoadObject& road_object = id_road_object.second;
        //     const std::size_t road_objs_idx_offset = road_objects_mesh.vertices.size();
        //     road_objects_mesh.road_object_start_indices[road_objs_idx_offset] = road_object.id;
        //     road_objects_mesh.add_mesh(road.get_road_object_mesh(road_object, eps));
        // }
    }

    return out_mesh;
}



struct xml_string_writer: pugi::xml_writer
{
    std::string result;

    virtual void write(const void* data, size_t size)
    {
        result.append(static_cast<const char*>(data), size);
    }
};

std::string node_to_string(pugi::xml_node node)
{
    xml_string_writer writer;
    node.print(writer);

    return writer.result;
}

std::string save_map(const OpenDriveMap& odr_map)
{
    std::string output = "<OpenDRIVE>";
    for (const auto& id_road : odr_map.id_to_road)
    {
        const Road& road = id_road.second;
        if (std::stod(road.id)<0) continue;

        output += node_to_string(road.xml_node);
    }
    for (const auto& id_junc : odr_map.id_to_junction)
    {
        const Junction& junc = id_junc.second;
        if (std::stod(junc.id)<0) continue;

        output += node_to_string(junc.xml_node);
    }
    output += "</OpenDRIVE>";
    return output;
}

Road get_road(const OpenDriveMap& odr_map, std::string id)
{
    return odr_map.id_to_road.at(id);
}

RoadNetworkMesh create_road_mesh(double eps, Road& road)
{
    RoadNetworkMesh  out_mesh;
    LanesMesh&       lanes_mesh = out_mesh.lanes_mesh;

    lanes_mesh.road_start_indices[lanes_mesh.vertices.size()] = road.id;

    for (const auto& s_lanesec : road.s_to_lanesection)
    {
        const LaneSection& lanesec = s_lanesec.second;
        lanes_mesh.lanesec_start_indices[lanes_mesh.vertices.size()] = lanesec.s0;
        for (const auto& id_lane : lanesec.id_to_lane)
        {
            const Lane&       lane = id_lane.second;
            const std::size_t lanes_idx_offset = lanes_mesh.vertices.size();

            if (lane.type != "driving"){continue;}
            lanes_mesh.lane_start_indices[lanes_idx_offset] = lane.id;
            lanes_mesh.add_mesh(road.get_lane_mesh(lane, eps));
        }
    }
    return out_mesh;
}

// void write_road_xml(OpenDriveMap& odr_map)
// {
//     Road& target_road = odr_map.id_to_road.at(p.road_id);
//     target_road.xml_node.attribute("length").set_value(p.road_length);
//     pugi::xml_node geometry = target_road.xml_node.child("planView").child("geometry");
//     geometry.attribute("x").set_value(p.x);
//     geometry.attribute("y").set_value(p.y);
//     geometry.attribute("hdg").set_value(p.hdg);
//     geometry.attribute("length").set_value(p.road_length);
//     if (!geometry.child("arc").empty()){
//         geometry.remove_child("arc");
//     }
//     else if (!geometry.child("line").empty()){
//         geometry.remove_child("line");
//     }
//     if (p.line_type=="arc"){
//         pugi::xml_node arc = geometry.append_child("arc");
//         arc.append_attribute("curvature").set_value(p.curvature);
//     }
//     else if (p.line_type=="line"){
//         geometry.append_child("line");
//     }
// }


void insert_lanes(Road& road, int start_lane, int end_lane){
    LaneSection& lanesection = road.s_to_lanesection.insert({0, LaneSection(road.id, 0)}).first->second;

    for (int lane_id=start_lane;lane_id<=end_lane;lane_id++)
    {
        Lane& lane = lanesection.id_to_lane.insert({lane_id,
                                 Lane(road.id, 0, lane_id, false, lane_id==0?"none":"driving")})
                        .first->second;

        lane.lane_width.s0_to_poly[0] = Poly3(0, 3.5, 0, 0, 0);
    }

    /* derive lane borders from lane widths */
    auto id_lane_iter0 = lanesection.id_to_lane.find(0);
    if (id_lane_iter0 == lanesection.id_to_lane.end())
        throw std::runtime_error("lane section does not have lane #0");

    /* iterate from id #0 towards +inf */
    auto id_lane_iter1 = std::next(id_lane_iter0);
    for (auto iter = id_lane_iter1; iter != lanesection.id_to_lane.end(); iter++)
    {
        if (iter == id_lane_iter0)
        {
            iter->second.outer_border = iter->second.lane_width;
        }
        else
        {
            iter->second.inner_border = std::prev(iter)->second.outer_border;
            iter->second.outer_border = std::prev(iter)->second.outer_border.add(iter->second.lane_width);
        }
    }

    /* iterate from id #0 towards -inf */
    std::map<int, Lane>::reverse_iterator r_id_lane_iter_1(id_lane_iter0);
    for (auto r_iter = r_id_lane_iter_1; r_iter != lanesection.id_to_lane.rend(); r_iter++)
    {
        if (r_iter == r_id_lane_iter_1)
        {
            r_iter->second.outer_border = r_iter->second.lane_width.negate();
        }
        else
        {
            r_iter->second.inner_border = std::prev(r_iter)->second.outer_border;
            r_iter->second.outer_border = std::prev(r_iter)->second.outer_border.add(r_iter->second.lane_width.negate());
        }
    }

    for (auto& id_lane : lanesection.id_to_lane)
    {
        id_lane.second.inner_border = id_lane.second.inner_border.add(road.lane_offset);
        id_lane.second.outer_border = id_lane.second.outer_border.add(road.lane_offset);
    }

}

Road create_preview_road(OpenDriveMap& odr_map, std::string road_id)
{
    Road& road = odr_map.id_to_road.insert({road_id,Road(road_id,10,"-1",road_id)}).first->second;

    road.ref_line.s0_to_geometry[0] = std::make_unique<Line>(0, 0, 0, 0, 10);

    insert_lanes(road, -2, 0);

    return road;
}

void delete_road(OpenDriveMap& odr_map, std::string id)
{   
    Road& road = odr_map.id_to_road.at(id);
    std::cout<<"road.junction "<<road.junction <<std::endl;
    std::cout<<"road.predecessor.id "<<road.predecessor.id <<std::endl;
    std::cout<<"road.successor.id "<<road.successor.id <<std::endl;
    if (road.predecessor.id != "-1"){
        if (road.predecessor.type==RoadLink::Type_Road){
            Road& pred_road = odr_map.id_to_road.at(road.predecessor.id);
            pugi::xml_node pred_successor = pred_road.xml_node.child("link").child("successor");
            pred_successor.attribute("elementId").set_value("-1");
            pred_successor.attribute("elementType").set_value("road");
        }
    }
    if (road.successor.id != "-1"){
        if (road.successor.type==RoadLink::Type_Road){
            Road& succ_road = odr_map.id_to_road.at(road.successor.id);
            pugi::xml_node succ_predecessor = succ_road.xml_node.child("link").child("predecessor");
            succ_predecessor.attribute("elementId").set_value("-1");
            succ_predecessor.attribute("elementType").set_value("road");
        }
    }
    if (road.junction != "-1"){
        std::cout<< "road.junction " << road.junction<<std::endl;
        for (auto& id_junction_pair : odr_map.id_to_junction)
        {
            Junction& junc = id_junction_pair.second;
            for (pugi::xml_node connection: junc.xml_node.children("connection")){
                std::cout<<connection.attribute("connectingRoad").value()<<std::endl;
                if (connection.attribute("connectingRoad").value()==id){
                    junc.xml_node.remove_child(connection);
                }
            }
        }
    }
    odr_map.id_to_road.erase(id);
}

void update_road(Road& road, int start_lane, int end_lane, bool isarc1, double x1, double y1, double hdg1, double len1, double cur1,
                 bool two_geo, bool isarc2, double x2, double y2, double hdg2, double len2, double cur2)
{   

    g_isarc1 = isarc1;
    g_x1 = x1;
    g_y1 = y1;
    g_hdg1 = hdg1;
    g_len1 = len1;
    g_cur1 = cur1;
    g_two_geo = two_geo;
    g_isarc2 = isarc2;
    g_x2 = x2;
    g_y2 = y2;
    g_hdg2 = hdg2;
    g_len2 = len2;
    g_cur2 = cur2;

    road.s_to_lanesection.clear();
    insert_lanes(road, start_lane, end_lane);

    road.length = len1+len2;

    road.ref_line.s0_to_geometry.clear();

    if (road.length<0.1) return;

    if (isarc1){
        road.ref_line.s0_to_geometry[0] = std::make_unique<Arc>(0, x1, y1, hdg1, len1, cur1);
    }
    else{
        road.ref_line.s0_to_geometry[0] = std::make_unique<Line>(0, x1, y1, hdg1, len1);
    }
    if (two_geo){
        if (isarc2){
            road.ref_line.s0_to_geometry[len1] = std::make_unique<Arc>(len1, x2, y2, hdg2, len2, cur2);
        }
        else{
            road.ref_line.s0_to_geometry[len1] = std::make_unique<Line>(len1, x2, y2, hdg2, len2);
        }
    }
}

void add_lane(pugi::xml_node& laneSectionChild, int lane_id){
    pugi::xml_node lane_r = laneSectionChild.append_child("lane");
    lane_r.append_attribute("id").set_value(lane_id);
    lane_r.append_attribute("type").set_value("driving");
    lane_r.append_attribute("level").set_value("false");
    pugi::xml_node link_r = lane_r.append_child("link");
    link_r.append_child("predecessor").append_attribute("id").set_value(lane_id);
    link_r.append_child("successor").append_attribute("id").set_value(lane_id);
    pugi::xml_node width_r = lane_r.append_child("width");
    width_r.append_attribute("sOffset").set_value("0");
    width_r.append_attribute("a").set_value("3.5");
    width_r.append_attribute("b").set_value("0");
    width_r.append_attribute("c").set_value("0");
    width_r.append_attribute("d").set_value("0");
}

void add_link_road(OpenDriveMap& odr_map, Road& preview_road, std::string junc_id, std::string pred_road_id, int pred_lane_id, std::string succ_road_id, int succ_lane_id){
    std::vector<Lane> lanes = preview_road.s_to_lanesection.at(0).get_lanes();
    int min_lane_id = 0;
    int max_lane_id = 0;
    for(Lane& lane : lanes){
        if (lane.id>max_lane_id) max_lane_id = lane.id;
        if (lane.id<min_lane_id) min_lane_id = lane.id;
    }

    // CONNECT
    Road& pred_road = odr_map.id_to_road.at(pred_road_id);
    pugi::xml_node pred_successor = pred_road.xml_node.child("link").child("successor");

    Road& succ_road = odr_map.id_to_road.at(succ_road_id);
    pugi::xml_node succ_predecessor = succ_road.xml_node.child("link").child("predecessor");

    std::string new_road_id = std::to_string(get_new_road_id(odr_map));
    Road& new_road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,preview_road.length,junc_id,new_road_id)}).first->second;
    new_road.xml_node = create_road_xml(odr_map,new_road_id,min_lane_id,max_lane_id);
    new_road.xml_node.attribute("junction").set_value(junc_id.c_str());
    new_road.xml_node.child("link").child("predecessor").attribute("elementId").set_value(pred_road_id.c_str());
    new_road.xml_node.child("link").child("successor").attribute("elementId").set_value(succ_road_id.c_str());
    new_road.xml_node.child("lanes").child("laneSection").child("right").child("lane").child("link").child("predecessor").attribute("id").set_value(pred_lane_id);
    new_road.xml_node.child("lanes").child("laneSection").child("right").child("lane").child("link").child("successor").attribute("id").set_value(succ_lane_id);
    pred_successor.attribute("elementType").set_value("junction");
    pred_successor.attribute("elementId").set_value(junc_id.c_str());

    succ_predecessor.attribute("elementType").set_value("junction");
    succ_predecessor.attribute("elementId").set_value(junc_id.c_str());
}

void add_link(OpenDriveMap& odr_map, Road& preview_road, std::string junc_id, std::string in_road_id, int in_lane_id, std::string out_road_id, int out_lane_id){

    Junction& junc = odr_map.id_to_junction.at(junc_id);
    int count = 0;
    for (pugi::xml_node connection: junc.xml_node.children("connection"))
    {
        // TODO: check if a connection already exists between the two roads 
        // if (std::stoi(connection.attribute("incomingRoad").value())==std::stoi(in_road_id)){
        //     std::string con_road_id = connection.attribute("connectingRoad").value();
        //     Road& con_road = odr_map.id_to_road.at(con_road_id);
        //     if (con_road.successor.id == out_road_id){
        //         Lane lane = con_road.s_to_lanesection[0].id_to_lane[-1];
        //         if (lane.predecessor == in_lane_id && lane.successor == out_lane_id ){
        //             // if so, return;
        //             std::cout<<"connection already exists"<<std::endl;
        //             return;
        //         }
        //     }
        // }
        count++;
    }

    add_link_road(odr_map, preview_road, junc_id, in_road_id, in_lane_id, out_road_id, out_lane_id);

    pugi::xml_node connection = junc.xml_node.append_child("connection");
    connection.append_attribute("id").set_value(count+1);
    connection.append_attribute("incomingRoad").set_value(in_road_id.c_str());
    connection.append_attribute("connectingRoad").set_value(get_new_road_id(odr_map)-1);
    connection.append_attribute("contactPoint").set_value("start");
    pugi::xml_node laneLink = connection.append_child("laneLink");
    laneLink.append_attribute("from").set_value(in_lane_id);
    laneLink.append_attribute("to").set_value(-1);



    // set in_road's successor as junction

    // set out_road's predecessor as junction

    // pugi::xml_node connection = junc.xml_node.append_child("connection");
    // pugi::xml_node laneLink = connection.append_child("laneLink");
    // laneLink.append_attribute("from").set_value(in_lane_id);
    // laneLink.append_attribute("to").set_value(con_lane_id);

    

    // int connection_id = 0;
    // int count = 0;
    // pugi::xml_node con_node;
    
    // if (connection_id > 0){
    //     // if so, add a laneLink
    //     pugi::xml_node laneLink = con_node.append_child("laneLink");
    //     laneLink.append_attribute("from").set_value(in_lane_id);
    //     laneLink.append_attribute("to").set_value(con_lane_id);
    // }
    // else{
    //     // if not, add a connection
    //     connection_id = count+1;
    //     pugi::xml_node new_con_node = junc_node.append_child("connection");
    //     new_con_node.append_attribute("id").set_value(connection_id);
    //     new_con_node.append_attribute("incomingRoad").set_value(in_road_id.c_str());
    //     new_con_node.append_attribute("connectingRoad").set_value(con_road_id.c_str());
    //     new_con_node.append_attribute("contactPoint").set_value("start");
    //     pugi::xml_node laneLink = new_con_node.append_child("laneLink");
    //     laneLink.append_attribute("from").set_value(in_lane_id);
    //     laneLink.append_attribute("to").set_value(con_lane_id);
    // }


    // void add_link()
// {
    // pugi::xml_node new_road_predecessor = new_road.xml_node.child("link").child("predecessor");
    // new_road_predecessor.attribute("elementId").set_value(pred_road_id.c_str());

    // std::string new_junc_id = std::to_string(get_new_junction_id(odr_map));

    // add_link(new_junction.xml_node,pred_road_id,-1,new_road_id,-1);
    // add_link(new_junction.xml_node,pred_road_id,-2,new_road_id,-2);
    // add_link(new_junction.xml_node,pred_road_id,-1,pred_successor_id,-1);
    // add_link(new_junction.xml_node,pred_road_id,-2,pred_successor_id,-2);

    // new_road.xml_node.attribute("junction").set_value(new_junc_id.c_str());
    // pred_successor_road.xml_node.attribute("junction").set_value(new_junc_id.c_str());

    // pred_successor.attribute("elementId").set_value(new_junc_id.c_str());
    // pred_successor.attribute("elementType").set_value("junction");
    // pred_successor.remove_attribute("contactPoint");

    // change new_road's link
    // new_road.xml_node.child("link").child("predecessor").attribute("elementType").set_value("junction");
    // new_road.xml_node.child("link").child("predecessor").attribute("elementId").set_value(new_junc_id.c_str());
    // new_road.xml_node.child("link").child("predecessor").remove_attribute("contactPoint");

    // change pred_successor's link
// }

}

pugi::xml_node create_road_xml(OpenDriveMap& odr_map, std::string id, int min_lane_id, int max_lane_id)
{
    pugi::xml_node new_road_node = odr_map.xml_doc.append_child("road");
    new_road_node.append_attribute("length").set_value(g_len1+g_len2);
    new_road_node.append_attribute("id").set_value(id.c_str());
    new_road_node.append_attribute("junction").set_value("-1");
    pugi::xml_node link = new_road_node.append_child("link");
    pugi::xml_node predecessor = link.append_child("predecessor");
    predecessor.append_attribute("elementType").set_value("road");
    predecessor.append_attribute("elementId").set_value("-1");
    predecessor.append_attribute("contactPoint").set_value("start");
    pugi::xml_node successor =link.append_child("successor");
    successor.append_attribute("elementType").set_value("road");
    successor.append_attribute("elementId").set_value("-1");
    successor.append_attribute("contactPoint").set_value("start");
    pugi::xml_node planView = new_road_node.append_child("planView");
    pugi::xml_node geometry = planView.append_child("geometry");
    geometry.append_attribute("s").set_value("0");
    geometry.append_attribute("x").set_value(g_x1);
    geometry.append_attribute("y").set_value(g_y1);
    geometry.append_attribute("hdg").set_value(g_hdg1);
    geometry.append_attribute("length").set_value(g_len1);
    if (g_isarc1){
        pugi::xml_node arc = geometry.append_child("arc");
        arc.append_attribute("curvature").set_value(g_cur1);
    }
    else{
        geometry.append_child("line");
    }

    if (g_two_geo){
        pugi::xml_node geometry2 = planView.append_child("geometry");
        geometry2.append_attribute("s").set_value(g_len1);
        geometry2.append_attribute("x").set_value(g_x2);
        geometry2.append_attribute("y").set_value(g_y2);
        geometry2.append_attribute("hdg").set_value(g_hdg2);
        geometry2.append_attribute("length").set_value(g_len2);
        if (g_isarc2){
            pugi::xml_node arc = geometry2.append_child("arc");
            arc.append_attribute("curvature").set_value(g_cur2);
        }
        else{
            geometry2.append_child("line");
        }
    }

    pugi::xml_node lanes = new_road_node.append_child("lanes");
    pugi::xml_node laneOffset = lanes.append_child("laneOffset");
    laneOffset.append_attribute("s").set_value("0");
    laneOffset.append_attribute("a").set_value("0");
    laneOffset.append_attribute("b").set_value("0");
    laneOffset.append_attribute("c").set_value("0");
    laneOffset.append_attribute("d").set_value("0");
    pugi::xml_node laneSection = lanes.append_child("laneSection");
    laneSection.append_attribute("s").set_value("0");
    pugi::xml_node center = laneSection.append_child("center");
    pugi::xml_node lane_c = center.append_child("lane");
    lane_c.append_attribute("id").set_value("0");
    lane_c.append_attribute("type").set_value("none");
    lane_c.append_attribute("level").set_value("false");
    pugi::xml_node left = laneSection.append_child("left");
    pugi::xml_node right = laneSection.append_child("right");
    for (int i=min_lane_id;i<=max_lane_id;i++){
        if (i==0) continue;
        if (i<0) add_lane(right,i);
        if (i>0) add_lane(left,i);
    }
    return new_road_node;
}

int get_new_road_id(const OpenDriveMap& odr_map)
{
    int max_road_id = 0;
    for (const auto& id_road_pair : odr_map.id_to_road)
    {
        int id = std::stoi(id_road_pair.first);
        if (id>max_road_id) max_road_id = id;
    }
    return max_road_id+1;
}

pugi::xml_node create_junc_xml(OpenDriveMap& odr_map, std::string new_id){
    pugi::xml_node new_junc_node = odr_map.xml_doc.append_child("junction");
    new_junc_node.append_attribute("id").set_value(new_id.c_str());
    new_junc_node.append_attribute("name").set_value(("junction"+new_id).c_str());
    return new_junc_node;
}

int get_new_junction_id(const OpenDriveMap& odr_map)
{
    int max_junction_id = 0;
    for (const auto& id_junction_pair : odr_map.id_to_junction)
    {
        int id = std::stoi(id_junction_pair.first);
        if (id>max_junction_id) max_junction_id = id;
    }
    return max_junction_id+1;
}

void create_new_junction(OpenDriveMap& odr_map)
{   
    std::string new_junc_id = std::to_string(get_new_junction_id(odr_map));
    Junction& new_junction = odr_map.id_to_junction.insert({new_junc_id,Junction("",new_junc_id)}).first->second;
    new_junction.xml_node = create_junc_xml(odr_map,new_junc_id);
}

std::vector<std::string> get_junction_ids(OpenDriveMap& odr_map)
{
    std::vector<std::string> junction_ids;
    for (const auto& id_junction_pair : odr_map.id_to_junction)
    {
        junction_ids.push_back(id_junction_pair.first);
    }
    return junction_ids;
}

void delete_junction(OpenDriveMap& odr_map, std::string junction_id)
{   
    Junction& junc = odr_map.id_to_junction.at(junction_id);
    // if (road.junction == "-1"){
    //     std::cout<<"road.junction "<<road.junction <<std::endl;
    //     std::cout<<"road.predecessor.id "<<road.predecessor.id <<std::endl;
    //     std::cout<<"road.successor.id "<<road.successor.id <<std::endl;
    //     if (road.predecessor.id != "-1"){
    //         Road& pred_road = odr_map.id_to_road.at(road.predecessor.id);
    //         pugi::xml_node pred_successor = pred_road.xml_node.child("link").child("successor");
    //         pred_successor.attribute("elementId").set_value("-1");
    //     }
    //     if (road.successor.id != "-1"){
    //         Road& succ_road = odr_map.id_to_road.at(road.successor.id);
    //         pugi::xml_node succ_predecessor = succ_road.xml_node.child("link").child("predecessor");
    //         succ_predecessor.attribute("elementId").set_value("-1");
    //     }
    // }
    odr_map.id_to_junction.erase(junction_id);
}

std::vector<double> calc_end(std::string line_type, double x, double y, double hdg, double road_length, double curvature)
{
    std::vector<double> x_y_hdg;
    if (line_type=="arc"){
        double radius = 1/curvature;
        double theta = road_length/radius;
        double dx = sin(theta)*radius;
        double dy = (1-cos(theta))*radius;
        double ddx = dx*cos(hdg)-dy*sin(hdg);
        double ddy = dy*cos(hdg)+dx*sin(hdg);
        x_y_hdg.push_back(x+ddx);
        x_y_hdg.push_back(y+ddy);
        x_y_hdg.push_back(hdg+theta);
    }
    else{
        double ddx = cos(hdg)*road_length;
        double ddy = sin(hdg)*road_length;
        x_y_hdg.push_back(x+ddx);
        x_y_hdg.push_back(y+ddy);
        x_y_hdg.push_back(hdg);
    }

    return x_y_hdg;
}

std::vector<double> get_end(OpenDriveMap& odr_map, std::string road_id, int lane_id)
{
    Road& road = odr_map.id_to_road.at(road_id);
    RoadGeometry& RG = *road.ref_line.s0_to_geometry.at(0);
    double temp_s = 0;
    if (RG.length<road.length){
        temp_s = RG.length;
    }
    if (lane_id>0) lane_id-=1;
    if (lane_id<0) lane_id+=1;
    Vec3D xyz = road.get_xyz(road.length,3.5*lane_id,0);
    RoadGeometry& RG2 = *road.ref_line.s0_to_geometry.at(temp_s);
    std::vector<double> end;
    if (RG2.type == GeometryType::GeometryType_Line){
        end = calc_end("line",RG2.x0,RG2.y0,RG2.hdg0,RG2.length,0);
    }
    else{
        Arc *arc = dynamic_cast<Arc*>(&RG2);
        end = calc_end("arc",RG2.x0,RG2.y0,RG2.hdg0,RG2.length,(*arc).curvature);
    }
    return {xyz[0],xyz[1],end[2]};
}

std::vector<double> get_start(OpenDriveMap& odr_map, std::string road_id, int lane_id)
{
    Road& road = odr_map.id_to_road.at(road_id);
    RoadGeometry& RG = *road.ref_line.s0_to_geometry.at(0);
    if (lane_id>0) lane_id-=1;
    if (lane_id<0) lane_id+=1;
    Vec3D xyz = road.get_xyz(0,3.5*lane_id,0);

    return {xyz[0],xyz[1],RG.hdg0};
}

std::vector<std::vector<double>> get_road_arrows(const OpenDriveMap& odr_map)
{
    std::vector<std::vector<double>> road_arrows;
    for (const auto& id_road : odr_map.id_to_road)
    {
        const Road& road = id_road.second;
        
        if (std::stod(road.id)<0) continue;
        
        std::vector<double> tmp_vec;
        RoadGeometry& RG = *road.ref_line.s0_to_geometry.at(0);
        tmp_vec.push_back(RG.x0);
        tmp_vec.push_back(RG.y0);
        tmp_vec.push_back(RG.hdg0);
        
        double temp_s = 0;
        if (RG.length<road.length){
            temp_s = RG.length;
        }

        RoadGeometry& RG2 = *road.ref_line.s0_to_geometry.at(temp_s);

        // std::cout<<RG.type<<std::endl;
        if (RG2.type == GeometryType::GeometryType_Line){
            std::vector<double> x_y_hdg = calc_end("line",RG2.x0,RG2.y0,RG2.hdg0,RG2.length,0);
            tmp_vec.push_back(x_y_hdg[0]);
            tmp_vec.push_back(x_y_hdg[1]);
            tmp_vec.push_back(x_y_hdg[2]);
        }
        else{
            Arc *arc = dynamic_cast<Arc*>(&RG2);
            std::vector<double> x_y_hdg = calc_end("arc",RG2.x0,RG2.y0,RG2.hdg0,RG2.length,(*arc).curvature);
            tmp_vec.push_back(x_y_hdg[0]);
            tmp_vec.push_back(x_y_hdg[1]);
            tmp_vec.push_back(x_y_hdg[2]);
        }

        tmp_vec.push_back(std::stod(road.junction));
        tmp_vec.push_back(std::stod(road.id));

        if (road.predecessor.type==RoadLink::Type_Road && road.junction=="-1"){
            tmp_vec.push_back(std::stod(road.predecessor.id));
        }
        else{
            tmp_vec.push_back(-1);
        }
        if (road.successor.type==RoadLink::Type_Road && road.junction=="-1"){
            tmp_vec.push_back(std::stod(road.successor.id));
        }
        else{
            tmp_vec.push_back(-1);
        }
        road_arrows.push_back(tmp_vec);
    }
    return road_arrows;
}



void add_road(OpenDriveMap& odr_map, Road& preview_road, std::string pred_road_id, std::string succ_road_id)
{
    std::vector<Lane> lanes = preview_road.s_to_lanesection.at(0).get_lanes();
    int min_lane_id = 0;
    int max_lane_id = 0;
    for(Lane& lane : lanes){
        if (lane.id>max_lane_id) max_lane_id = lane.id;
        if (lane.id<min_lane_id) min_lane_id = lane.id;
    }

    if (pred_road_id=="-1"){
        // CREATE
        std::string new_road_id = std::to_string(get_new_road_id(odr_map));
        Road& new_road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,preview_road.length,"-1",new_road_id)}).first->second;
        new_road.xml_node = create_road_xml(odr_map,new_road_id,min_lane_id,max_lane_id);
    }
    else{
        Road& pred_road = odr_map.id_to_road.at(pred_road_id);
        pugi::xml_node pred_successor = pred_road.xml_node.child("link").child("successor");
        bool pred_no_succ = std::stoi(pred_successor.attribute("elementId").value())==-1;

        if (succ_road_id=="-1"){
            // EXTEND
            if (!pred_no_succ) return; // predecessor already has successor
                
            // predecessor has no successor
            std::string new_road_id = std::to_string(get_new_road_id(odr_map));
            Road& new_road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,preview_road.length,"-1",new_road_id)}).first->second;
            new_road.xml_node = create_road_xml(odr_map,new_road_id,min_lane_id,max_lane_id);
            new_road.xml_node.child("link").child("predecessor").attribute("elementId").set_value(pred_road_id.c_str());
            pred_successor.attribute("elementId").set_value(new_road_id.c_str());
        }
        else{
            // CONNECT
            Road& succ_road = odr_map.id_to_road.at(succ_road_id);
            pugi::xml_node succ_predecessor = succ_road.xml_node.child("link").child("predecessor");
            bool succ_no_pred = std::stoi(succ_predecessor.attribute("elementId").value())==-1;

            if (!pred_no_succ) return; // predecessor already has successor
            if (!succ_no_pred) return; // successor already has predecessor

            // connect two roads that weren't connected to anything
            std::string new_road_id = std::to_string(get_new_road_id(odr_map));
            Road& new_road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,preview_road.length,"-1",new_road_id)}).first->second;
            new_road.xml_node = create_road_xml(odr_map,new_road_id,min_lane_id,max_lane_id);
            new_road.xml_node.child("link").child("predecessor").attribute("elementId").set_value(pred_road_id.c_str());
            new_road.xml_node.child("link").child("successor").attribute("elementId").set_value(succ_road_id.c_str());

            pred_successor.attribute("elementId").set_value(new_road_id.c_str());
            succ_predecessor.attribute("elementId").set_value(new_road_id.c_str());
        }
    }
}



} // namespace odr