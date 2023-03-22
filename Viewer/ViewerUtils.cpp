#include "ViewerUtils.h"
#include "Math.hpp"
#include "OpenDriveMap.h"
#include "RefLine.h"
#include "Road.h"
#include "Geometries/Line.h"
#include "Geometries/Arc.h"
#include "Geometries/RoadGeometry.h"

#include <iostream>
#include <cassert>
#include <vector>
#include <cmath>
#define _USE_MATH_DEFINES
 
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

RoadNetworkMesh create_preview_mesh(double eps){
    return create_road_mesh(eps, preview_road);
}

RoadNetworkMesh create_handle_mesh(OpenDriveMap& odr_map, double eps, std::string id){
    return create_road_mesh(eps, odr_map.id_to_road.at(id));
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

Mesh3D create_preview_reflines(double eps){
    return create_road_reflines(eps, preview_road);
}

Mesh3D create_road_reflines(double eps, Road& road)
{
    /* indices are pairs of vertices representing line segments */
    Mesh3D reflines;

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

    return reflines;
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


void insert_lanes(Road& road, std::map<int, double> lane_widths){
    LaneSection& lanesection = road.s_to_lanesection.insert({0, LaneSection(road.id, 0)}).first->second;

    for (auto const& x : lane_widths)
    {   
        int lane_id = x.first;
        double lane_width = x.second;

        Lane& lane = lanesection.id_to_lane.insert({lane_id,
                                 Lane(road.id, 0, lane_id, false, lane_id==0?"none":"driving")})
                        .first->second;

        lane.lane_width.s0_to_poly[0] = Poly3(0, lane_width, 0, 0, 0);
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

void create_preview_road(OpenDriveMap& odr_map)
{
    odr_map.id_to_road.insert({"-1",preview_road});
    preview_road.ref_line.s0_to_geometry[0] = std::make_unique<Line>(0, 0, 0, 0, 10);
    insert_lanes(preview_road, {{-1, 3.5}, {0, 0}, {1, 3.5}});
}

void delete_road(OpenDriveMap& odr_map, std::string id)
{   
    Road& road = odr_map.id_to_road.at(id);
    std::cout<<"delete road: "<<id<<std::endl;
    // std::cout<<"road.junction "<<road.junction <<std::endl;
    // std::cout<<"road.predecessor.id "<<road.predecessor.id <<std::endl;
    // std::cout<<"road.successor.id "<<road.successor.id <<std::endl;
    if (road.junction != "-1"){
        // deleted road is junction type
        Junction& junc = odr_map.id_to_junction.at(road.junction);
        for (pugi::xml_node connection: junc.xml_node.children("connection")){
            if (connection.attribute("connectingRoad").value()==id){
                junc.xml_node.remove_child(connection);
                break;
            }
        }
        Road& pred_road = odr_map.id_to_road.at(road.predecessor.id);
        Road& succ_road = odr_map.id_to_road.at(road.successor.id);
        
        int pred_count = 0;
        int succ_count = 0;
        // look at all the roads within the junction and check if there are any references to pred/succ
        for (pugi::xml_node connection: junc.xml_node.children("connection")){
            Road& con_road = odr_map.id_to_road.at(connection.attribute("connectingRoad").value());
            if (con_road.predecessor.id == pred_road.id) pred_count++;
            if (con_road.successor.id == pred_road.id) pred_count++;
            if (con_road.predecessor.id == succ_road.id) succ_count++;
            if (con_road.successor.id == succ_road.id) succ_count++;
        }
        if (pred_count==0){
            // deleted road was last link
            int pred_lane_id = road.get_lanesection(0).id_to_lane.at(-1).predecessor;
            pugi::xml_node pred_successor = pred_road.xml_node.child("link").child("successor");
            pugi::xml_node pred_predecessor = pred_road.xml_node.child("link").child("predecessor");
            if (pred_lane_id<0){
                pred_successor.attribute("elementId").set_value("-1");
                pred_successor.attribute("elementType").set_value("road");
            }
            else{
                pred_predecessor.attribute("elementId").set_value("-1");
                pred_predecessor.attribute("elementType").set_value("road");
            }
        }
        if (succ_count==0){
            // deleted road was last link
            int succ_lane_id = road.get_lanesection(0).id_to_lane.at(-1).successor;
            pugi::xml_node succ_successor = succ_road.xml_node.child("link").child("successor");
            pugi::xml_node succ_predecessor = succ_road.xml_node.child("link").child("predecessor");
            if (succ_lane_id<0){
                succ_predecessor.attribute("elementId").set_value("-1");
                succ_predecessor.attribute("elementType").set_value("road");
            }
            else{
                succ_successor.attribute("elementId").set_value("-1");
                succ_successor.attribute("elementType").set_value("road");
            }
        }
    }
    else{
        // deleted road is road type
        // can't delete if road is connected to junction
        if (road.predecessor.id != "-1" && road.predecessor.type==RoadLink::Type_Junction) return;
        if (road.successor.id != "-1" && road.successor.type==RoadLink::Type_Junction) return;

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
    }
    odr_map.id_to_road.erase(id);
}

void update_preview_road(std::vector<std::vector<double>> geometries, std::map<int, double> lane_widths)
{   
    preview_road.s_to_lanesection.clear();
    insert_lanes(preview_road, lane_widths);
    preview_road.ref_line.s0_to_geometry.clear();
    // std::cout<<"geometries.size() "<<geometries.size()<<std::endl;
    double s = 0;
    for (std::vector<double>& vd : geometries){
        if (vd.at(0)){
            preview_road.ref_line.s0_to_geometry[s] = std::make_unique<Arc>(s, vd.at(1), vd.at(2), vd.at(3), vd.at(4), vd.at(5));
        }
        else{
            preview_road.ref_line.s0_to_geometry[s] = std::make_unique<Line>(s, vd.at(1), vd.at(2), vd.at(3), vd.at(4));
        }
        s+=vd.at(4);
    }

    preview_road.length = s;
}

void add_lane_xml(pugi::xml_node& laneSectionChild, int lane_id, double lane_width){
    pugi::xml_node lane_r = laneSectionChild.append_child("lane");
    lane_r.append_attribute("id").set_value(lane_id);
    lane_r.append_attribute("type").set_value("driving");
    lane_r.append_attribute("level").set_value("false");
    pugi::xml_node link_r = lane_r.append_child("link");
    link_r.append_child("predecessor").append_attribute("id").set_value(lane_id);
    link_r.append_child("successor").append_attribute("id").set_value(lane_id);
    pugi::xml_node width_r = lane_r.append_child("width");
    width_r.append_attribute("sOffset").set_value("0");
    width_r.append_attribute("a").set_value(lane_width);
    width_r.append_attribute("b").set_value("0");
    width_r.append_attribute("c").set_value("0");
    width_r.append_attribute("d").set_value("0");
}

void add_link_road(OpenDriveMap& odr_map, std::vector<std::vector<double>> geometries, std::map<int, double> lane_widths, std::string junc_id, std::string pred_road_id, int pred_lane_id, std::string succ_road_id, int succ_lane_id){
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
    pugi::xml_node pred_predecessor = pred_road.xml_node.child("link").child("predecessor");

    Road& succ_road = odr_map.id_to_road.at(succ_road_id);
    pugi::xml_node succ_predecessor = succ_road.xml_node.child("link").child("predecessor");
    pugi::xml_node succ_successor = succ_road.xml_node.child("link").child("successor");

    std::string new_road_id = std::to_string(get_new_road_id(odr_map));
    Road& new_road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,preview_road.length,junc_id,new_road_id)}).first->second;
    new_road.xml_node = create_road_xml(odr_map,new_road_id,min_lane_id,max_lane_id,lane_widths,geometries);
    new_road.xml_node.attribute("junction").set_value(junc_id.c_str());
    new_road.xml_node.child("link").child("predecessor").attribute("elementId").set_value(pred_road_id.c_str());
    new_road.xml_node.child("link").child("successor").attribute("elementId").set_value(succ_road_id.c_str());
    new_road.xml_node.child("lanes").child("laneSection").child("right").child("lane").child("link").child("predecessor").attribute("id").set_value(pred_lane_id);
    new_road.xml_node.child("lanes").child("laneSection").child("right").child("lane").child("link").child("successor").attribute("id").set_value(succ_lane_id);

    if(pred_lane_id<0){
        pred_successor.attribute("elementType").set_value("junction");
        pred_successor.attribute("elementId").set_value(junc_id.c_str());
    }
    else{
        pred_predecessor.attribute("elementType").set_value("junction");
        pred_predecessor.attribute("elementId").set_value(junc_id.c_str());
    }

    if(succ_lane_id<0){
        succ_predecessor.attribute("elementType").set_value("junction");
        succ_predecessor.attribute("elementId").set_value(junc_id.c_str());
    }
    else{
        succ_successor.attribute("elementType").set_value("junction");
        succ_successor.attribute("elementId").set_value(junc_id.c_str());
    }
}

void add_link(OpenDriveMap& odr_map, std::vector<std::vector<double>> geometries, std::map<int, double> lane_widths, std::string junc_id, std::string in_road_id, int in_lane_id, std::string out_road_id, int out_lane_id)
{
    Junction& junc = odr_map.id_to_junction.at(junc_id);
    int max_con_id = 0;
    for (pugi::xml_node connection: junc.xml_node.children("connection"))
    {
        // check if a connection already exists between the two lanes 
        std::string con_road_id = connection.attribute("connectingRoad").value();
        Road& con_road = odr_map.id_to_road.at(con_road_id);
        int pred_lane_id = con_road.get_lanesection(0).id_to_lane.at(-1).predecessor;
        int succ_lane_id = con_road.get_lanesection(0).id_to_lane.at(-1).successor;
        if (con_road.predecessor.id == in_road_id && con_road.successor.id == out_road_id && pred_lane_id == in_lane_id && succ_lane_id == out_lane_id){
            std::cout<<"connection already exists"<<std::endl;
            return;
        }
        if (std::stoi(connection.attribute("id").value())>max_con_id) max_con_id = std::stoi(connection.attribute("id").value());
    }

    add_link_road(odr_map, geometries, lane_widths, junc_id, in_road_id, in_lane_id, out_road_id, out_lane_id);

    pugi::xml_node connection = junc.xml_node.append_child("connection");
    connection.append_attribute("id").set_value(max_con_id+1);
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

pugi::xml_node create_road_xml(OpenDriveMap& odr_map, std::string id, int min_lane_id, int max_lane_id, std::map<int, double> lane_widths, std::vector<std::vector<double>> geometries)
{
    pugi::xml_node new_road_node = odr_map.xml_doc.append_child("road");
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

    double s = 0;
    for (std::vector<double>& vd : geometries){
        pugi::xml_node geometry = planView.append_child("geometry");
        geometry.append_attribute("s").set_value(s);
        geometry.append_attribute("x").set_value(vd.at(1));
        geometry.append_attribute("y").set_value(vd.at(2));
        geometry.append_attribute("hdg").set_value(vd.at(3));
        geometry.append_attribute("length").set_value(vd.at(4));
        if (vd.at(0)){
            pugi::xml_node arc = geometry.append_child("arc");
            arc.append_attribute("curvature").set_value(vd.at(5));
        }
        else{
            geometry.append_child("line");
        }
        s+=vd.at(4);
    }
    new_road_node.append_attribute("length").set_value(s);

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
        add_lane_xml(right,i,lane_widths.at(i));
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
    // Junction& junc = odr_map.id_to_junction.at(junction_id);
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
    // odr_map.id_to_junction.erase(junction_id);
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

double get_lane_width(Road& road, int lane_id)
{
    assert(road.get_lanesection(0).id_to_lane.find(lane_id) != road.get_lanesection(0).id_to_lane.end());
    return road.get_lanesection(0).id_to_lane.at(lane_id).lane_width.get_poly(0).a;
}

std::map<int, double> get_lane_widths(OpenDriveMap& odr_map, std::string id)
{
    std::map<int, double> lane_widths;
    Road& road = odr_map.id_to_road.at(id);
    const LaneSection& lanesec = road.get_lanesection(0);
    for (const auto& id_lane : lanesec.id_to_lane)
    {
        lane_widths[id_lane.first] = get_lane_width(road,id_lane.first);
    }
    return lane_widths;
}

double calc_t(Road& road, int lane_id){
    double t = 0;
    if (lane_id<0){
        for (int i=-1;i>=lane_id;i--){
            t += get_lane_width(road,i);
        }
    }
    else{
        for (int i=1;i<=lane_id;i++){
            t += get_lane_width(road,i);
        } 
    }
    return t;
}

std::vector<double> get_end(OpenDriveMap& odr_map, std::string road_id, int lane_id)
{
    Road& road = odr_map.id_to_road.at(road_id);
    RoadGeometry& RG = *road.ref_line.s0_to_geometry.at(0);

    if (lane_id>0) lane_id-=1;
    if (lane_id<0) lane_id+=1;
    
    Vec3D xyz = road.get_xyz(road.length,calc_t(road,lane_id),0);

    double hdg = RG.hdg0;

    for (auto itr : road.ref_line.get_geometries())
    {
        if (itr->type == GeometryType::GeometryType_Arc){
            Arc *arc = dynamic_cast<Arc*>(itr);
            double curvature = (*arc).curvature;
            double radius = 1/curvature;
            hdg += itr->length/radius;
            if (hdg>M_PI){
                hdg-=M_PI*2;
            }
            if (hdg<-M_PI){
                hdg+=M_PI*2;
            }
        }
    } 
    // RoadGeometry& RG2 = *road.ref_line.s0_to_geometry.at(temp_s);
    // std::vector<double> end;
    // if (RG2.type == GeometryType::GeometryType_Line){
    //     end = calc_end("line",RG2.x0,RG2.y0,RG2.hdg0,RG2.length,0);
    // }
    // else{
    //     Arc *arc = dynamic_cast<Arc*>(&RG2);
    //     end = calc_end("arc",RG2.x0,RG2.y0,RG2.hdg0,RG2.length,(*arc).curvature);
        
    // }
    // return {xyz[0],xyz[1],end[2]};
    return {xyz[0],xyz[1],hdg};
}

std::vector<double> get_start(OpenDriveMap& odr_map, std::string road_id, int lane_id)
{
    Road& road = odr_map.id_to_road.at(road_id);
    RoadGeometry& RG = *road.ref_line.s0_to_geometry.at(0);
    if (lane_id>0) lane_id-=1;
    if (lane_id<0) lane_id+=1;

    Vec3D xyz = road.get_xyz(0,calc_t(road,lane_id),0);

    return {xyz[0],xyz[1],RG.hdg0};
}

std::vector<std::vector<double>>get_junction_bboxes(OpenDriveMap& odr_map)
{
    std::vector<std::vector<double>> junction_bboxes;
    for (auto& id_junction : odr_map.id_to_junction){
        std::vector<double> junction_bbox;
        junction_bbox.push_back(std::stod(id_junction.first));
        Junction& junc = id_junction.second;
        double minx = std::numeric_limits<double>::max();
        double miny = std::numeric_limits<double>::max();
        double maxx = std::numeric_limits<double>::lowest();
        double maxy = std::numeric_limits<double>::lowest();
        Vec3D xyz;
        for (auto& id_conn : junc.id_to_connection){
            Road& road = odr_map.id_to_road.at(id_conn.second.connecting_road);
            xyz = road.get_xyz(0,calc_t(road,-1),0);
            if (xyz[0]>maxx) maxx = xyz[0];
            if (xyz[0]<minx) minx = xyz[0];
            if (xyz[1]>maxy) maxy = xyz[1];
            if (xyz[1]<miny) miny = xyz[1];
            xyz = road.get_xyz(road.length,calc_t(road,-1),0);
            if (xyz[0]>maxx) maxx = xyz[0];
            if (xyz[0]<minx) minx = xyz[0];
            if (xyz[1]>maxy) maxy = xyz[1];
            if (xyz[1]<miny) miny = xyz[1];
            xyz = road.get_xyz(0,0,0);
            if (xyz[0]>maxx) maxx = xyz[0];
            if (xyz[0]<minx) minx = xyz[0];
            if (xyz[1]>maxy) maxy = xyz[1];
            if (xyz[1]<miny) miny = xyz[1];
            xyz = road.get_xyz(road.length,0,0);
            if (xyz[0]>maxx) maxx = xyz[0];
            if (xyz[0]<minx) minx = xyz[0];
            if (xyz[1]>maxy) maxy = xyz[1];
            if (xyz[1]<miny) miny = xyz[1];
        }
        junction_bbox.push_back(minx);
        junction_bbox.push_back(miny);
        junction_bbox.push_back(maxx);
        junction_bbox.push_back(maxy);
        junction_bboxes.push_back(junction_bbox);
    }
    return junction_bboxes;
}

std::vector<std::vector<double>> get_road_arrows(OpenDriveMap& odr_map)
{
    std::vector<std::vector<double>> road_arrows;
    for (auto& id_road : odr_map.id_to_road)
    {
        Road& road = id_road.second;
        if (std::stod(road.id)<0) continue;

        std::vector<double> tmp_vec;
        Vec3D xyz;
        double type;

        for (auto& ls : road.get_lanesections()){
            type = road.junction=="-1"?0:1; 
            for (auto& lane : ls.get_lanes()){
                double lane_w = get_lane_width(road,lane.id)/2;
                double lane_t = -calc_t(road,lane.id);
                if (lane.id<0) {
                    tmp_vec.clear();
                    tmp_vec.push_back(type);
                    xyz = road.get_xyz(1,lane_t+lane_w,0);
                    tmp_vec.push_back(xyz.at(0));
                    tmp_vec.push_back(xyz.at(1));
                    xyz = road.get_xyz(2,lane_t+lane_w,0);
                    tmp_vec.push_back(xyz.at(0));
                    tmp_vec.push_back(xyz.at(1));
                    road_arrows.push_back(tmp_vec);

                    tmp_vec.clear();
                    tmp_vec.push_back(type);
                    xyz = road.get_xyz(road.length-2,lane_t+lane_w,0);
                    tmp_vec.push_back(xyz.at(0));
                    tmp_vec.push_back(xyz.at(1));
                    xyz = road.get_xyz(road.length-1,lane_t+lane_w,0);
                    tmp_vec.push_back(xyz.at(0));
                    tmp_vec.push_back(xyz.at(1));
                    road_arrows.push_back(tmp_vec);
                }
                else if (lane.id>0) {
                    tmp_vec.clear();
                    tmp_vec.push_back(type);
                    xyz = road.get_xyz(2,-lane_t-lane_w,0);
                    tmp_vec.push_back(xyz.at(0));
                    tmp_vec.push_back(xyz.at(1));
                    xyz = road.get_xyz(1,-lane_t-lane_w,0);
                    tmp_vec.push_back(xyz.at(0));
                    tmp_vec.push_back(xyz.at(1));
                    road_arrows.push_back(tmp_vec);

                    tmp_vec.clear();
                    tmp_vec.push_back(type);
                    xyz = road.get_xyz(road.length-1,-lane_t-lane_w,0);
                    tmp_vec.push_back(xyz.at(0));
                    tmp_vec.push_back(xyz.at(1));
                    xyz = road.get_xyz(road.length-2,-lane_t-lane_w,0);
                    tmp_vec.push_back(xyz.at(0));
                    tmp_vec.push_back(xyz.at(1));
                    road_arrows.push_back(tmp_vec);
                }
            }
        }

        if (road.junction=="-1"){
            if (road.predecessor.type==RoadLink::Type_Road && road.predecessor.id!="-1"){
                //pred_road->road
                tmp_vec.clear();
                tmp_vec.push_back(2);
                Road& pred_road = odr_map.id_to_road.at(road.predecessor.id);
                bool opposite_dir = euclDistance(road.get_xyz(0,0,0),pred_road.get_xyz(0,0,0))<0.1;
                xyz = pred_road.get_xyz(opposite_dir?0:pred_road.length,0,0);
                tmp_vec.push_back(xyz.at(0));
                tmp_vec.push_back(xyz.at(1));
                xyz = road.get_xyz(1,0,0);
                tmp_vec.push_back(xyz.at(0));
                tmp_vec.push_back(xyz.at(1));
                road_arrows.push_back(tmp_vec);
            }
            else if (road.predecessor.type==RoadLink::Type_Junction && road.predecessor.id!="-1"){
                //pred_junc->road
                Junction& pred_junc = odr_map.id_to_junction.at(road.predecessor.id);
                for (auto& id_conn : pred_junc.id_to_connection){
                    Road& pred_junc_road = odr_map.id_to_road.at(id_conn.second.connecting_road);
                    if (pred_junc_road.successor.id==road.id){
                        tmp_vec.clear();
                        tmp_vec.push_back(4);
                        double pred_junc_road_lw = calc_t(pred_junc_road,-1);
                        xyz = pred_junc_road.get_xyz(pred_junc_road.length,-pred_junc_road_lw/2,0);
                        tmp_vec.push_back(xyz.at(0));
                        tmp_vec.push_back(xyz.at(1));
                        double road_lw = calc_t(road,-1);
                        int to_lane_id = pred_junc_road.get_lanesection(0).id_to_lane.at(-1).successor;
                        double t = to_lane_id>0?to_lane_id*road_lw-road_lw/2:to_lane_id*road_lw+road_lw/2;
                        xyz = road.get_xyz(1,t,0);
                        tmp_vec.push_back(xyz.at(0));
                        tmp_vec.push_back(xyz.at(1));
                        road_arrows.push_back(tmp_vec);
                    }
                    if (pred_junc_road.predecessor.id==road.id){
                        tmp_vec.clear();
                        tmp_vec.push_back(4);
                        double road_lw = calc_t(road,-1);
                        int from_lane_id = pred_junc_road.get_lanesection(0).id_to_lane.at(-1).predecessor;
                        double t = from_lane_id>0?from_lane_id*road_lw-road_lw/2:from_lane_id*road_lw+road_lw/2;
                        xyz = road.get_xyz(1,t,0);
                        tmp_vec.push_back(xyz.at(0));
                        tmp_vec.push_back(xyz.at(1));
                        double pred_junc_road_lw = calc_t(pred_junc_road,-1);
                        xyz = pred_junc_road.get_xyz(0,-pred_junc_road_lw/2,0);
                        tmp_vec.push_back(xyz.at(0));
                        tmp_vec.push_back(xyz.at(1));
                        road_arrows.push_back(tmp_vec);
                    }
                }
            }
            if (road.successor.type==RoadLink::Type_Road && road.successor.id!="-1"){
                //road->succ_road
                tmp_vec.clear();
                tmp_vec.push_back(2);
                xyz = road.get_xyz(road.length-1,0,0);
                tmp_vec.push_back(xyz.at(0));
                tmp_vec.push_back(xyz.at(1));
                Road& succ_road = odr_map.id_to_road.at(road.successor.id);
                bool opposite_dir = euclDistance(road.get_xyz(road.length,0,0),succ_road.get_xyz(succ_road.length,0,0))<0.1;
                xyz = succ_road.get_xyz(opposite_dir?succ_road.length:0,0,0);
                tmp_vec.push_back(xyz.at(0));
                tmp_vec.push_back(xyz.at(1));
                road_arrows.push_back(tmp_vec);
            }
            else if (road.successor.type==RoadLink::Type_Junction && road.successor.id!="-1"){
                //road->succ_junc
                Junction& succ_junc = odr_map.id_to_junction.at(road.successor.id);
                for (auto& id_conn : succ_junc.id_to_connection){
                    Road& succ_junc_road = odr_map.id_to_road.at(id_conn.second.connecting_road);
                    if (succ_junc_road.predecessor.id==road.id){
                        tmp_vec.clear();
                        tmp_vec.push_back(4);
                        double road_lw = calc_t(road,-1);
                        int from_lane_id = succ_junc_road.get_lanesection(0).id_to_lane.at(-1).predecessor;
                        double t = from_lane_id>0?from_lane_id*road_lw-road_lw/2:from_lane_id*road_lw+road_lw/2;
                        xyz = road.get_xyz(from_lane_id>0?1:road.length-1,t,0);
                        tmp_vec.push_back(xyz.at(0));
                        tmp_vec.push_back(xyz.at(1));
                        double succ_junc_road_lw = calc_t(succ_junc_road,-1);
                        xyz = succ_junc_road.get_xyz(0,-succ_junc_road_lw/2,0);
                        tmp_vec.push_back(xyz.at(0));
                        tmp_vec.push_back(xyz.at(1));
                        road_arrows.push_back(tmp_vec);
                    }
                    if (succ_junc_road.successor.id==road.id){
                        tmp_vec.clear();
                        tmp_vec.push_back(4);
                        double succ_junc_road_lw = calc_t(succ_junc_road,-1);
                        xyz = succ_junc_road.get_xyz(succ_junc_road.length,-succ_junc_road_lw/2,0);
                        tmp_vec.push_back(xyz.at(0));
                        tmp_vec.push_back(xyz.at(1));
                        double road_lw = calc_t(road,-1);
                        int from_lane_id = succ_junc_road.get_lanesection(0).id_to_lane.at(-1).successor;
                        double t = from_lane_id>0?from_lane_id*road_lw-road_lw/2:from_lane_id*road_lw+road_lw/2;
                        xyz = road.get_xyz(from_lane_id>0?road.length-1:1,t,0);
                        tmp_vec.push_back(xyz.at(0));
                        tmp_vec.push_back(xyz.at(1));
                        road_arrows.push_back(tmp_vec);
                    }
                }
            }
        }
        else{
            if (road.predecessor.type==RoadLink::Type_Road){
                //pred_road->junc
                tmp_vec.clear();
                tmp_vec.push_back(3);
                int from_lane_id = road.get_lanesection(0).id_to_lane.at(-1).predecessor;
                Road& pred_road = odr_map.id_to_road.at(road.predecessor.id);
                double pred_road_lw = calc_t(pred_road,-1);
                double t = from_lane_id>0?from_lane_id*pred_road_lw-pred_road_lw/2:from_lane_id*pred_road_lw+pred_road_lw/2;
                xyz = pred_road.get_xyz(from_lane_id>0?0:pred_road.length,t,0);
                tmp_vec.push_back(xyz.at(0));
                tmp_vec.push_back(xyz.at(1));
                double road_lw = calc_t(road,-1);
                Vec3D xyz = road.get_xyz(1,-road_lw/2,0);
                tmp_vec.push_back(xyz.at(0));
                tmp_vec.push_back(xyz.at(1));
                road_arrows.push_back(tmp_vec);
                // tmp_vec.push_back(-1);tmp_vec.push_back(-1);tmp_vec.push_back(-1);
            }
            else{
                //pred_junc->junc
            }
            if (road.successor.type==RoadLink::Type_Road){
                //junc->succ_road
                tmp_vec.clear();
                tmp_vec.push_back(3);
                int to_lane_id = road.get_lanesection(0).id_to_lane.at(-1).successor;
                double road_lw = calc_t(road,-1);
                Vec3D xyz = road.get_xyz(road.length-1,-road_lw/2,0);
                tmp_vec.push_back(xyz.at(0));
                tmp_vec.push_back(xyz.at(1));
                Road& succ_road = odr_map.id_to_road.at(road.successor.id);
                double succ_road_lw = calc_t(succ_road,-1);
                double t = to_lane_id>0?to_lane_id*succ_road_lw-succ_road_lw/2:to_lane_id*succ_road_lw+succ_road_lw/2;
                xyz = succ_road.get_xyz(to_lane_id>0?succ_road.length:0,t,0);
                tmp_vec.push_back(xyz.at(0));
                tmp_vec.push_back(xyz.at(1));
                road_arrows.push_back(tmp_vec);
            }
            else{
                //junc->succ_junc
            }
        }
        
    }
    return road_arrows;
}

void edit_road(OpenDriveMap& odr_map, std::string sel_road_id, std::map<int, double> lane_widths)
{
    Road& sel_road = odr_map.id_to_road.at(sel_road_id);
    // no need to change the actual road object, just change the xml because we're gonna write it
    sel_road.xml_node.child("lanes").child("laneSection").remove_child("left");
    sel_road.xml_node.child("lanes").child("laneSection").remove_child("right");
    pugi::xml_node left = sel_road.xml_node.child("lanes").child("laneSection").append_child("left");
    pugi::xml_node right = sel_road.xml_node.child("lanes").child("laneSection").append_child("right");

    for (auto const& x : lane_widths)
    {   
        int lane_id = x.first;
        double lane_width = x.second;

        if (lane_id<0){
            add_lane_xml(right, lane_id, lane_width);
        }
        else if (lane_id>0){
            add_lane_xml(left, lane_id, lane_width);
        }
    }
}

void add_road(OpenDriveMap& odr_map, std::vector<std::vector<double>> geometries, std::map<int, double> lane_widths, std::string pred_road_id, std::string succ_road_id)
{
    std::vector<Lane> lanes = preview_road.s_to_lanesection.at(0).get_lanes();
    int min_lane_id = 0;
    int max_lane_id = 0;
    for(Lane& lane : lanes){
        if (lane.id>max_lane_id) max_lane_id = lane.id;
        if (lane.id<min_lane_id) min_lane_id = lane.id;
    }
    if (min_lane_id==0 && max_lane_id==0) return;

    if (pred_road_id=="-1"){
        // CREATE
        std::string new_road_id = std::to_string(get_new_road_id(odr_map));
        Road& new_road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,preview_road.length,"-1",new_road_id)}).first->second;
        new_road.xml_node = create_road_xml(odr_map,new_road_id,min_lane_id,max_lane_id,lane_widths,geometries);
    }
    else{
        Road& pred_road = odr_map.id_to_road.at(pred_road_id);
        pugi::xml_node pred_successor = pred_road.xml_node.child("link").child("successor");
        bool pred_no_succ = std::stoi(pred_successor.attribute("elementId").value())==-1;
        pugi::xml_node pred_predecessor = pred_road.xml_node.child("link").child("predecessor");
        bool pred_no_pred = std::stoi(pred_predecessor.attribute("elementId").value())==-1;
        bool opposite_dir_pred = euclDistance(preview_road.get_xyz(0,0,0),pred_road.get_xyz(0,0,0))<0.1;

        if (succ_road_id=="-1"){
            // EXTEND
            if (opposite_dir_pred && (!pred_no_pred)) return; // opposite facing predecessor already has predecessor
            if ((!opposite_dir_pred) && (!pred_no_succ)) return; // same facing predecessor already has successor

            std::string new_road_id = std::to_string(get_new_road_id(odr_map));
            Road& new_road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,preview_road.length,"-1",new_road_id)}).first->second;
            new_road.xml_node = create_road_xml(odr_map,new_road_id,min_lane_id,max_lane_id,lane_widths,geometries);
            new_road.xml_node.child("link").child("predecessor").attribute("elementId").set_value(pred_road_id.c_str());
            if (opposite_dir_pred){
                pred_predecessor.attribute("elementId").set_value(new_road_id.c_str());
            }
            else{
                pred_successor.attribute("elementId").set_value(new_road_id.c_str());
            }

        }
        else{
            // CONNECT
            Road& succ_road = odr_map.id_to_road.at(succ_road_id);
            pugi::xml_node succ_predecessor = succ_road.xml_node.child("link").child("predecessor");
            bool succ_no_pred = std::stoi(succ_predecessor.attribute("elementId").value())==-1;
            pugi::xml_node succ_successor = succ_road.xml_node.child("link").child("successor");
            bool succ_no_succ = std::stoi(succ_successor.attribute("elementId").value())==-1;
            bool opposite_dir_succ = euclDistance(preview_road.get_xyz(preview_road.length,0,0),succ_road.get_xyz(succ_road.length,0,0))<0.1;

            if (opposite_dir_pred && (!pred_no_pred)){
                // opposite facing predecessor already has predecessor
                std::cout<<"opposite facing predecessor already has predecessor"<<std::endl;
                return;
            }
            if ((!opposite_dir_pred) && (!pred_no_succ)){
                // same facing predecessor already has successor
                std::cout<<"same facing predecessor already has successor"<<std::endl;
                return;
            }
            if (opposite_dir_succ && (!succ_no_succ)){
                // opposite facing successor already has successor
                std::cout<<"opposite facing successor already has successor"<<std::endl;
                return;
            }
            if ((!opposite_dir_succ) && (!succ_no_pred)){
                // same facing successor already has predecessor
                std::cout<<"same facing successor already has predecessor"<<std::endl;
                return;
            }

            // connect two roads that weren't connected to anything
            std::string new_road_id = std::to_string(get_new_road_id(odr_map));
            Road& new_road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,preview_road.length,"-1",new_road_id)}).first->second;
            new_road.xml_node = create_road_xml(odr_map,new_road_id,min_lane_id,max_lane_id,lane_widths,geometries);
            new_road.xml_node.child("link").child("predecessor").attribute("elementId").set_value(pred_road_id.c_str());
            new_road.xml_node.child("link").child("successor").attribute("elementId").set_value(succ_road_id.c_str());

            if (opposite_dir_pred){
                pred_predecessor.attribute("elementId").set_value(new_road_id.c_str());
            }
            else{
                pred_successor.attribute("elementId").set_value(new_road_id.c_str());
            }
            if (opposite_dir_succ){
                succ_successor.attribute("elementId").set_value(new_road_id.c_str());
            }
            else{
                succ_predecessor.attribute("elementId").set_value(new_road_id.c_str());
            }
        }
    }
}



} // namespace odr