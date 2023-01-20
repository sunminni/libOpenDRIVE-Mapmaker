#pragma once
#include "Mesh.h"
#include "RoadNetworkMesh.h"
#include "Road.h"

namespace odr
{

class OpenDriveMap;

Mesh3D          get_refline_segments(const OpenDriveMap& odr_map, double eps);
RoadNetworkMesh get_road_network_mesh(const OpenDriveMap& odr_map, double eps);
std::vector<std::string> get_road_ids(const OpenDriveMap& odr_map);
RoadNetworkMesh create_road_mesh(double eps, Road road);
Road create_new_road(OpenDriveMap& odr_map, double eps);

} // namespace odr