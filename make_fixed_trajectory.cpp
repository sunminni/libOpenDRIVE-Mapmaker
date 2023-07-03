#include "Lane.h"
#include "LaneSection.h"
#include "Math.hpp"
#include "Mesh.h"
#include "OpenDriveMap.h"
#include "Road.h"

#include <stdio.h>
#include <vector>
#include <fstream>


void outfile_write(std::ofstream& outfile, odr::Road& road, double s, double t, int road_id, int lane_id, int dtype){
    auto xyz = road.get_xyz(s,t,0);
    outfile.write((char *) &road_id, sizeof(road_id));
    outfile.write((char *) &lane_id, sizeof(lane_id));
    outfile.write((char *) &dtype, sizeof(dtype));
    outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
    outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));
}

double get_mt(odr::Lane& lane, double s){
    return (lane.outer_border.get(s)+lane.inner_border.get(s))/2;
}

double get_it_near(odr::Lane& lane, double s){
    return (lane.outer_border.get(s)+lane.inner_border.get(s)*3)/4;
}

double get_it_far(odr::Lane& lane, double s){
    return lane.inner_border.get(s);
}

double get_ot_near(odr::Lane& lane, double s){
    return (lane.outer_border.get(s)*3+lane.inner_border.get(s))/4;
}

double get_ot_far(odr::Lane& lane, double s){
    return lane.outer_border.get(s);
}

int main(int argc, char** argv)
{
    if (argc < 2)
    {
        printf("ERROR: too few arguments\n");
        return -1;
    }
    odr::OpenDriveMap odr_map(argv[1]);
    const double      eps = 0.5;
    int roadlane_type = 0;
    int roadline_type = 1;
    int data_type = 2;
    std::ofstream outfile("fixed_trajectory.bin", std::ios::out | std::ios::binary);

    std::vector<odr::Vec3D> lane_pts;

    for (odr::Road road : odr_map.get_roads())
    {
        int road_id = stoi(road.id);
        // if (road_id!=38) continue;

        for (odr::LaneSection lanesection : road.get_lanesections())
        {
            const double s_start = lanesection.s0;
            const double s_end = road.get_lanesection_end(lanesection);

            for (odr::Lane lane : lanesection.get_lanes())
            {
                int lane_id = lane.id;
                if (lane_id!=-1) continue;
                for (double s = s_start; s<=s_end; s+=eps){
                    double ot = lane.outer_border.get(s);
                    double it = lane.inner_border.get(s);
                    double mt = (ot+it)/2;
                    outfile_write(outfile,road,s,mt,road_id,lane_id,roadlane_type);
                }
            }
        }
    }
    printf("max data_type: %d\n", data_type);

    outfile.close();

    printf("Finished, got %lu lane points\n", lane_pts.size());
    return 0;
}
