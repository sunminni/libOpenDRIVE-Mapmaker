#pragma once
#include "Mesh.h"
#include "RoadNetworkMesh.h"
#include "Road.h"

namespace odr
{

class OpenDriveMap;

Mesh3D get_refline_segments(const OpenDriveMap& odr_map, double eps);
RoadNetworkMesh get_road_network_mesh(const OpenDriveMap& odr_map, double eps);
std::vector<std::vector<double>> get_road_arrows(const OpenDriveMap& odr_map);
std::string save_map(const OpenDriveMap& odr_map);
Road get_road(const OpenDriveMap& odr_map, std::string id);
RoadNetworkMesh create_road_mesh(double eps, Road& road);
Mesh3D create_road_reflines(double eps, Road& road);
void update_road(Road& road, std::vector<std::vector<double>> geometries, int start_lane, int end_lane, double lane_width);
// void write_road_xml(OpenDriveMap& odr_map);
void delete_road(OpenDriveMap& odr_map, std::string id);
std::vector<double> get_end(OpenDriveMap& odr_map, std::string road_id, int lane_id);
std::vector<double> get_start(OpenDriveMap& odr_map, std::string road_id, int lane_id);
void add_road(OpenDriveMap& odr_map, Road& preview_road, std::vector<std::vector<double>> geometries, std::string pred_road_id, std::string succ_road_id);
int get_new_road_id(const OpenDriveMap& odr_map);
Road create_preview_road(OpenDriveMap& odr_map, std::string road_id);
void create_new_junction(OpenDriveMap& odr_map);
std::vector<std::string> get_junction_ids(OpenDriveMap& odr_map);
void delete_junction(OpenDriveMap& odr_map, std::string junction_id);
std::vector<double> calc_end(std::string line_type, double x, double y, double hdg, double road_length, double curvature);
void add_link(OpenDriveMap& odr_map, Road& preview_road, std::vector<std::vector<double>> geometries, std::string junc_id, std::string in_road_id, int in_lane_id, std::string out_road_id, int out_lane_id);
pugi::xml_node create_road_xml(OpenDriveMap& odr_map, std::string id, int min_lane_id, int max_lane_id, double lane_width, std::vector<std::vector<double>> geometries);
double get_lane_width(Road& road);

} // namespace odr