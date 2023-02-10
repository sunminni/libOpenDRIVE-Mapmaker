#pragma once
#include "Mesh.h"
#include "RoadNetworkMesh.h"
#include "Road.h"

namespace odr
{

struct ROAD_PARAMS
{
    ROAD_PARAMS() = default;
    std::string line_type = "line";
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

static std::vector<int> link_params;

Mesh3D get_refline_segments(const OpenDriveMap& odr_map, double eps);
RoadNetworkMesh get_road_network_mesh(const OpenDriveMap& odr_map, double eps);
std::vector<std::vector<double>> get_road_arrows(const OpenDriveMap& odr_map);
std::string save_map(const OpenDriveMap& odr_map);
Road get_road_and_params(const OpenDriveMap& odr_map, ROAD_PARAMS& p);
RoadNetworkMesh create_road_mesh(double eps, Road road);
void update_road(Road& handleRoad, ROAD_PARAMS& p);
void write_road_xml(OpenDriveMap& odr_map, ROAD_PARAMS& p);
void delete_road(OpenDriveMap& odr_map, ROAD_PARAMS& p);
std::vector<double> get_end(ROAD_PARAMS& p);
void add_road(OpenDriveMap& odr_map, ROAD_PARAMS& p);
ROAD_PARAMS create_RP();
int get_new_road_id(const OpenDriveMap& odr_map);
Road create_preview_road(OpenDriveMap& odr_map, std::string road_id);
void link_params_push(int a);
void link_params_clear();

} // namespace odr