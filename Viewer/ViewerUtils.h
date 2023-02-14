#pragma once
#include "Mesh.h"
#include "RoadNetworkMesh.h"
#include "Road.h"

namespace odr
{

static double g_isarc1;
static double g_x1;
static double g_y1;
static double g_hdg1;
static double g_len1;
static double g_cur1;

static double g_two_geo;
static double g_isarc2;
static double g_x2;
static double g_y2;
static double g_hdg2;
static double g_len2;
static double g_cur2;

class OpenDriveMap;

Mesh3D get_refline_segments(const OpenDriveMap& odr_map, double eps);
RoadNetworkMesh get_road_network_mesh(const OpenDriveMap& odr_map, double eps);
std::vector<std::vector<double>> get_road_arrows(const OpenDriveMap& odr_map);
std::string save_map(const OpenDriveMap& odr_map);
Road get_road(const OpenDriveMap& odr_map, std::string id);
RoadNetworkMesh create_road_mesh(double eps, Road road);
void update_road(Road& road, bool isarc1, double x1, double y1, double hdg1, double len1, double cur1,
                 bool two_geo, bool isarc2, double x2, double y2, double hdg2, double len2, double cur2);
// void write_road_xml(OpenDriveMap& odr_map);
void delete_road(OpenDriveMap& odr_map, std::string id);
std::vector<double> get_end(OpenDriveMap& odr_map, std::string road_id, int lane_id);
std::vector<double> get_start(OpenDriveMap& odr_map, std::string road_id, int lane_id);
void add_road(OpenDriveMap& odr_map, Road& road, std::string pred_road_id, std::string succ_road_id);
int get_new_road_id(const OpenDriveMap& odr_map);
Road create_preview_road(OpenDriveMap& odr_map, std::string road_id);
void create_new_junction(OpenDriveMap& odr_map);
std::vector<std::string> get_junction_ids(OpenDriveMap& odr_map);
void delete_junction(OpenDriveMap& odr_map, std::string junction_id);
std::vector<double> calc_end(std::string line_type, double x, double y, double hdg, double road_length, double curvature);

} // namespace odr