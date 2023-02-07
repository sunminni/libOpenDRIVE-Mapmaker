#pragma once
#include "Mesh.h"
#include "RoadNetworkMesh.h"
#include "Road.h"

namespace odr
{

struct NEW_ROAD_PARAMS
{
    NEW_ROAD_PARAMS() = default;
    std::string line_type = "";
    std::string road_id = "";
    double road_length = 10.0;
    double x = 0;
    double y = 0;
    double hdg = 0;
    double curvature = 0;
    bool predecessorIJ = false;
    std::string predecessorID = "";
    int predecessorCP = 0;
    std::string successor = "";
};

class OpenDriveMap;

Mesh3D          get_refline_segments(const OpenDriveMap& odr_map, double eps);
RoadNetworkMesh get_road_network_mesh(const OpenDriveMap& odr_map, double eps);
std::vector<std::string> get_road_ids(const OpenDriveMap& odr_map);
std::string save_map(const OpenDriveMap& odr_map);
Road get_road(const OpenDriveMap& odr_map, std::string road_id, NEW_ROAD_PARAMS& p);
RoadNetworkMesh create_road_mesh(double eps, Road road);
void update_handle_road(Road& handleRoad, NEW_ROAD_PARAMS& p);
void write_handle_road_xml(OpenDriveMap& odr_map, NEW_ROAD_PARAMS& p);
void delete_road(OpenDriveMap& odr_map, NEW_ROAD_PARAMS& p);
std::vector<std::string> update_new_road(OpenDriveMap& odr_map, NEW_ROAD_PARAMS p);
// Road update_new_road(OpenDriveMap& odr_map, NEW_ROAD_PARAMS p);
void remove_new_road(OpenDriveMap& odr_map);
void create_new_road(OpenDriveMap& odr_map, double eps);
NEW_ROAD_PARAMS init_NRP();

} // namespace odr