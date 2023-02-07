#include "ViewerUtils.h"
#include "Math.hpp"
#include "OpenDriveMap.h"
#include "RefLine.h"
#include "Road.h"
#include "Geometries/Line.h"
#include "Geometries/Arc.h"

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

std::vector<std::string> get_road_ids(const OpenDriveMap& odr_map)
{
    std::vector<std::string>road_ids;
    for (const auto& id_road : odr_map.id_to_road)
    {
        const Road& road = id_road.second;
        road_ids.push_back(road.id);
    }
    return road_ids;
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
        output += node_to_string(road.xml_node);
    }
    output += "</OpenDRIVE>";
    return output;
}

Road get_road(const OpenDriveMap& odr_map, NEW_ROAD_PARAMS& p)
{
    Road target_road = odr_map.id_to_road.at(p.road_id);
    p.road_length = target_road.length;
    p.x = std::stod(target_road.xml_node.child("planView").child("geometry").attribute("x").value());
    p.y = std::stod(target_road.xml_node.child("planView").child("geometry").attribute("y").value());
    p.hdg = std::stod(target_road.xml_node.child("planView").child("geometry").attribute("hdg").value());
    if (!target_road.xml_node.child("planView").child("geometry").child("arc").empty()){
        p.line_type = "arc";
        p.curvature = std::stod(target_road.xml_node.child("planView").child("geometry").child("arc").attribute("curvature").value());
    }
    else{
        p.line_type = "line";
    }
    return target_road;
}

RoadNetworkMesh create_road_mesh(double eps, Road road){
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
            Mesh3D asdf = road.get_lane_mesh(lane, eps);

            lanes_mesh.add_mesh(road.get_lane_mesh(lane, eps));
        }
    }
    return out_mesh;
}

void write_handle_road_xml(OpenDriveMap& odr_map, NEW_ROAD_PARAMS& p)
{
    std::cout<<"p.road_id: "<<p.road_id<<std::endl;
    Road& target_road = odr_map.id_to_road.at(p.road_id);
    target_road.xml_node.attribute("length").set_value(p.road_length);
    pugi::xml_node geometry = target_road.xml_node.child("planView").child("geometry");
    geometry.attribute("x").set_value(p.x);
    geometry.attribute("y").set_value(p.y);
    geometry.attribute("hdg").set_value(p.hdg);
    geometry.attribute("length").set_value(p.road_length);
    if (!geometry.child("arc").empty()){
        geometry.remove_child("arc");
    }
    else if (!geometry.child("line").empty()){
        geometry.remove_child("line");
    }
    if (p.line_type=="arc"){
        pugi::xml_node arc = geometry.append_child("arc");
        arc.append_attribute("curvature").set_value(p.curvature);
    }
    else if (p.line_type=="line"){
        geometry.append_child("line");
    }
}

void delete_road(OpenDriveMap& odr_map, NEW_ROAD_PARAMS& p)
{
    odr_map.id_to_road.erase(p.road_id);
}

void update_handle_road(Road& handleRoad, NEW_ROAD_PARAMS& p)
{
    handleRoad.length = p.road_length;
    if (p.line_type=="arc"){
        handleRoad.ref_line.s0_to_geometry[0] = std::make_unique<Arc>(0, p.x, p.y, p.hdg, p.road_length, p.curvature);
    }
    else if (p.line_type=="line"){
        handleRoad.ref_line.s0_to_geometry[0] = std::make_unique<Line>(0, p.x, p.y, p.hdg, p.road_length);
    }
    handleRoad.predecessor.id = p.predecessorID;
    handleRoad.predecessor.type = RoadLink::Type::Type_Road;
    handleRoad.predecessor.contact_point = RoadLink::ContactPoint::ContactPoint_Start;
}

// std::vector<std::string> update_new_road(OpenDriveMap& odr_map, NEW_ROAD_PARAMS p)
// {   
//     std::vector<std::string> road_ids = {};
//     Road& new_road = odr_map.id_to_road.at("new_road");
//     new_road.length = p.road_length;
//     new_road.ref_line.s0_to_geometry[0] = std::make_unique<Line>(0, p.x, p.y, p.hdg, p.road_length);
//     new_road.predecessor.id = p.predecessorID;
//     // new_road.predecessor.type = p.predecessorIJ ? RoadLink::Type::Type_Junction : RoadLink::Type::Type_Road;
//     new_road.predecessor.type = RoadLink::Type::Type_Road;
//     new_road.predecessor.contact_point = RoadLink::ContactPoint::ContactPoint_Start;
    
//     new_road.xml_node.child("link").child("predecessor").attribute("elementId").set_value(new_road.predecessor.id.c_str());
//     new_road.xml_node.child("link").child("predecessor").attribute("elementType").set_value("road");
//     new_road.xml_node.child("link").child("predecessor").attribute("contactPoint").set_value("start");
//     new_road.xml_node.find_child_by_attribute("lane", "id", "-1").child("link").child("predecessor").attribute("id").set_value(new_road.predecessor.id.c_str());

//     road_ids.push_back("new_road");

//     if (p.predecessorID.size()>0){
//         for (auto& s_lanesec : new_road.s_to_lanesection)
//         {
//             LaneSection& lanesec = s_lanesec.second;
//             for (auto& id_lane : lanesec.id_to_lane)
//             {
//                 Lane& lane = id_lane.second;
//                 lane.predecessor = -1;
//             }
//         }
//         Road& other_road = odr_map.id_to_road.at(p.predecessorID);

//         other_road.successor.id = "new_road";
//         other_road.successor.type = RoadLink::Type::Type_Road;
//         other_road.successor.contact_point = RoadLink::ContactPoint::ContactPoint_End;
//         road_ids.push_back(p.predecessorID);

//         other_road.xml_node.child("link").child("successor").attribute("elementId").set_value(other_road.successor.id.c_str());
//         other_road.xml_node.child("link").child("successor").attribute("elementType").set_value("road");
//         other_road.xml_node.child("link").child("successor").attribute("contactPoint").set_value("end");
//         other_road.xml_node.find_child_by_attribute("lane", "id", "-1").child("link").child("successor").attribute("id").set_value(other_road.successor.id.c_str());

//         for (auto& s_lanesec : other_road.s_to_lanesection)
//         {
//             LaneSection& lanesec = s_lanesec.second;
//             for (auto& id_lane : lanesec.id_to_lane)
//             {
//                 Lane& lane = id_lane.second;
//                 lane.successor = -1;
//             }
//         }
//     }

//     return road_ids;
// }

// void remove_new_road(OpenDriveMap& odr_map){
//     odr_map.id_to_road.erase("new_road");
// }

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

pugi::xml_node create_road_xml(OpenDriveMap& odr_map, NEW_ROAD_PARAMS& p){
    pugi::xml_node new_road = odr_map.xml_doc.append_child("road");
    new_road.append_attribute("length").set_value(p.road_length);
    new_road.append_attribute("id").set_value(p.road_id.c_str());
    new_road.append_attribute("junction").set_value("-1");
    pugi::xml_node link = new_road.append_child("link");
    pugi::xml_node predecessor = link.append_child("predecessor");
    predecessor.append_attribute("elementType").set_value("road");
    predecessor.append_attribute("elementId").set_value("-1");
    predecessor.append_attribute("contactPoint").set_value("start");
    pugi::xml_node successor =link.append_child("successor");
    successor.append_attribute("elementType").set_value("road");
    successor.append_attribute("elementId").set_value("-1");
    successor.append_attribute("contactPoint").set_value("start");
    pugi::xml_node planView = new_road.append_child("planView");
    pugi::xml_node geometry = planView.append_child("geometry");
    geometry.append_attribute("s").set_value("0");
    geometry.append_attribute("x").set_value(p.x);
    geometry.append_attribute("y").set_value(p.y);
    geometry.append_attribute("hdg").set_value(p.hdg);
    geometry.append_attribute("length").set_value(p.road_length);
    geometry.append_child("line");

    pugi::xml_node lanes = new_road.append_child("lanes");
    pugi::xml_node laneOffset = lanes.append_child("laneOffset");
    laneOffset.append_attribute("s").set_value("0");
    laneOffset.append_attribute("a").set_value("0");
    laneOffset.append_attribute("b").set_value("0");
    laneOffset.append_attribute("c").set_value("0");
    laneOffset.append_attribute("d").set_value("0");
    pugi::xml_node laneSection = lanes.append_child("laneSection");
    laneSection.append_attribute("s").set_value("0");
    // pugi::xml_node left = laneSection.append_child("left");
    pugi::xml_node center = laneSection.append_child("center");
    pugi::xml_node lane_c = center.append_child("lane");
    lane_c.append_attribute("id").set_value("0");
    lane_c.append_attribute("type").set_value("none");
    lane_c.append_attribute("level").set_value("false");
    pugi::xml_node right = laneSection.append_child("right");
    add_lane(right,-1);
    add_lane(right,-2);

    return new_road;
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

void get_end(NEW_ROAD_PARAMS& p){
    if (p.line_type=="arc"){
        double radius = 1/p.curvature;
        double theta = p.road_length/radius;
        double dx = sin(theta)*radius;
        double dy = (1-cos(theta))*radius;
        double ddx = dx*cos(p.hdg)-dy*sin(p.hdg);
        double ddy = dy*cos(p.hdg)+dx*sin(p.hdg);
        p.x += ddx;
        p.y += ddy;
        p.hdg += theta;
    }
    else{
        p.x += cos(p.hdg)*p.road_length;
        p.y += sin(p.hdg)*p.road_length;
    }
}

void create_new_road(OpenDriveMap& odr_map, NEW_ROAD_PARAMS& p)
{
    std::string new_road_id = std::to_string(get_new_road_id(odr_map));
    p.road_id = new_road_id;
    get_end(p);
    p.road_length = 20;
    p.line_type = "line";

    std::string junc = "-1";
    Road& road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,p.road_length,junc,new_road_id)}).first->second;
    road.xml_node = create_road_xml(odr_map,p);
}

NEW_ROAD_PARAMS init_NRP(){
    return NEW_ROAD_PARAMS();
}

} // namespace odr