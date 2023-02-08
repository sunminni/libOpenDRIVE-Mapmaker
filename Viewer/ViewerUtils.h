#pragma once
#include "Mesh.h"
#include "RoadNetworkMesh.h"
#include "Road.h"

namespace odr
{

struct ROAD_PARAMS
{
    ROAD_PARAMS() = default;
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
Road get_road(const OpenDriveMap& odr_map, ROAD_PARAMS& p);
RoadNetworkMesh create_road_mesh(double eps, Road road);
void update_road(Road& handleRoad, ROAD_PARAMS& p);
void write_road_xml(OpenDriveMap& odr_map, ROAD_PARAMS& p);
void delete_road(OpenDriveMap& odr_map, ROAD_PARAMS& p);
// std::vector<std::string> update_new_road(OpenDriveMap& odr_map, ROAD_PARAMS p);
// Road update_new_road(OpenDriveMap& odr_map, ROAD_PARAMS p);
std::vector<double> get_end(ROAD_PARAMS& p);
void create_new_road(OpenDriveMap& odr_map, ROAD_PARAMS& p);
ROAD_PARAMS create_RP();

} // namespace odr