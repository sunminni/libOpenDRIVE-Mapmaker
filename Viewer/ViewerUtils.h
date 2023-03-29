#pragma once
#include "Mesh.h"
#include "RoadNetworkMesh.h"
#include "Road.h"

namespace odr
{

class OpenDriveMap;

static Road preview_road = Road("-1",10,"-1","-1");

Mesh3D get_refline_segments(const OpenDriveMap& odr_map, double eps);
RoadNetworkMesh get_road_network_mesh(const OpenDriveMap& odr_map, double eps);
std::vector<std::vector<double>> get_road_arrows(OpenDriveMap& odr_map);
std::string save_map(const OpenDriveMap& odr_map);
RoadNetworkMesh create_preview_mesh(double eps);
RoadNetworkMesh create_handle_mesh(OpenDriveMap& odr_map, double eps, std::string id);
RoadNetworkMesh create_road_mesh(double eps, Road& road);
Mesh3D create_preview_reflines(double eps);
Mesh3D create_handle_reflines(OpenDriveMap& odr_map, double eps, std::string id);
Mesh3D create_road_reflines(double eps, Road& road);
void update_preview_road(std::vector<std::vector<double>> geometries, std::map<int, std::vector<double>> lane_widths);
void update_handle_road(OpenDriveMap& odr_map, std::string road_id, std::map<int, std::vector<double>> lane_widths);
void delete_road(OpenDriveMap& odr_map, std::string id);
std::vector<double> get_end(OpenDriveMap& odr_map, std::string road_id, int lane_id);
std::vector<double> get_start(OpenDriveMap& odr_map, std::string road_id, int lane_id);
void add_road(OpenDriveMap& odr_map, std::vector<std::vector<double>> geometries, std::map<int, std::vector<double>> lane_widths, std::string pred_road_id, std::string succ_road_id);
int get_new_road_id(const OpenDriveMap& odr_map);
void create_preview_road(OpenDriveMap& odr_map);
void create_new_junction(OpenDriveMap& odr_map);
std::vector<std::string> get_junction_ids(OpenDriveMap& odr_map);
void delete_junction(OpenDriveMap& odr_map, std::string junction_id);
std::vector<double> calc_end(std::string line_type, double x, double y, double hdg, double road_length, double curvature);
void add_link(OpenDriveMap& odr_map, std::vector<std::vector<double>> geometries, std::map<int, std::vector<double>> lane_widths, std::string junc_id, std::string in_road_id, int in_lane_id, std::string out_road_id, int out_lane_id);
pugi::xml_node create_road_xml(OpenDriveMap& odr_map, std::string id, int min_lane_id, int max_lane_id, std::map<int, std::vector<double>> lane_widths, std::vector<std::vector<double>> geometries);
double calc_t(Road& road, int lane_id, double s);
std::vector<std::vector<double>>get_junction_bboxes(OpenDriveMap& odr_map);
void edit_road(OpenDriveMap& odr_map, std::string road_id, std::map<int, std::vector<double>> lane_widths);
std::vector<double> get_lane_offset(OpenDriveMap& odr_map, std::string id);
std::map<int, std::vector<double>> get_lane_widths(OpenDriveMap& odr_map, std::string id);
void merge_to_next_road(OpenDriveMap& odr_map, std::string road_id);

} // namespace odr