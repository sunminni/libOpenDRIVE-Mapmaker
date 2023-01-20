#include "ViewerUtils.h"
#include "Math.hpp"
#include "OpenDriveMap.h"
#include "RefLine.h"
#include "Road.h"
#include "Geometries/Line.h"

#include <iostream>
#include <vector>

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
    RoadmarksMesh&   roadmarks_mesh = out_mesh.roadmarks_mesh;
    RoadObjectsMesh& road_objects_mesh = out_mesh.road_objects_mesh;

    for (const auto& id_road : odr_map.id_to_road)
    {
        const Road& road = id_road.second;
        lanes_mesh.road_start_indices[lanes_mesh.vertices.size()] = road.id;
        roadmarks_mesh.road_start_indices[roadmarks_mesh.vertices.size()] = road.id;
        road_objects_mesh.road_start_indices[road_objects_mesh.vertices.size()] = road.id;

        for (const auto& s_lanesec : road.s_to_lanesection)
        {
            const LaneSection& lanesec = s_lanesec.second;
            lanes_mesh.lanesec_start_indices[lanes_mesh.vertices.size()] = lanesec.s0;
            roadmarks_mesh.lanesec_start_indices[roadmarks_mesh.vertices.size()] = lanesec.s0;
            for (const auto& id_lane : lanesec.id_to_lane)
            {
                const Lane&       lane = id_lane.second;
                const std::size_t lanes_idx_offset = lanes_mesh.vertices.size();
                if (lane.type != "driving"){continue;}

                lanes_mesh.lane_start_indices[lanes_idx_offset] = lane.id;
                lanes_mesh.add_mesh(road.get_lane_mesh(lane, eps));

                std::size_t roadmarks_idx_offset = roadmarks_mesh.vertices.size();
                roadmarks_mesh.lane_start_indices[roadmarks_idx_offset] = lane.id;
                const std::vector<RoadMark> roadmarks = lane.get_roadmarks(lanesec.s0, road.get_lanesection_end(lanesec));
                for (const RoadMark& roadmark : roadmarks)
                {
                    roadmarks_idx_offset = roadmarks_mesh.vertices.size();
                    roadmarks_mesh.roadmark_type_start_indices[roadmarks_idx_offset] = roadmark.type;
                    roadmarks_mesh.add_mesh(road.get_roadmark_mesh(lane, roadmark, eps));
                }
            }
        }

        for (const auto& id_road_object : road.id_to_object)
        {
            const RoadObject& road_object = id_road_object.second;
            const std::size_t road_objs_idx_offset = road_objects_mesh.vertices.size();
            road_objects_mesh.road_object_start_indices[road_objs_idx_offset] = road_object.id;
            road_objects_mesh.add_mesh(road.get_road_object_mesh(road_object, eps));
        }
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

Road create_new_road(OpenDriveMap& odr_map, double eps)
{
    std::string new_road_id = "new_road";
    std::string junc = "-1";
    // Road& road = Road(road_id,20,"-1","new_road");
    Road& road = odr_map.id_to_road.insert({new_road_id,Road(new_road_id,20.0,junc,new_road_id)}).first->second;

    road.ref_line.s0_to_geometry[0] = std::make_unique<Line>(0, 0, 0, 0, 20.0);
    LaneSection& lanesection = road.s_to_lanesection.insert({0, LaneSection(new_road_id, 0)}).first->second;

    for (int lane_id = 0;lane_id>-2;lane_id--){
        Lane& new_lane = lanesection.id_to_lane.insert({lane_id, odr::Lane(new_road_id, 0, lane_id, false, "driving")}).first->second;
        double s0 = 0.0;
        double s_offset = 0.0;
        new_lane.lane_width.s0_to_poly[s0 + s_offset] = Poly3(s0 + s_offset, 5, 0, 0, 0);
        new_lane.s_to_height_offset.insert({s0 + s_offset, HeightOffset(0, 0)});
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
    return road;
}

} // namespace odr