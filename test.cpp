#include "Lane.h"
#include "LaneSection.h"
#include "Math.hpp"
#include "Mesh.h"
#include "OpenDriveMap.h"
#include "Road.h"

#include <stdio.h>
#include <vector>
#include <fstream>

int main(int argc, char** argv)
{
    if (argc < 2)
    {
        printf("ERROR: too few arguments\n");
        return -1;
    }
    odr::OpenDriveMap odr_map(argv[1]);
    const double      eps = 0.2;
    int roadlane_type = 0;
    int roadline_type = 1;
    int data_type = 2;
    std::ofstream outfile("katech_points.bin", std::ios::out | std::ios::binary);

    std::vector<odr::Vec3D> lane_pts;

    for (odr::Road road : odr_map.get_roads())
    {
        int road_id = stoi(road.id);
        for (odr::LaneSection lanesection : road.get_lanesections())
        {
            const double s_start = lanesection.s0;
            const double s_end = road.get_lanesection_end(lanesection);

            for (odr::Lane lane : lanesection.get_lanes())
            {
                int lane_id = lane.id;
                
                for (double s = s_start; s<=s_end; s+=eps){
                    double ot = lane.outer_border.get(s);
                    auto xyz = road.get_xyz(s,ot,0);
                    outfile.write((char *) &road_id, sizeof(road_id));
                    outfile.write((char *) &lane_id, sizeof(lane_id));
                    outfile.write((char *) &roadline_type, sizeof(roadline_type));
                    outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
                    outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));

                    if (lane_id==-1){
                        double it = lane.inner_border.get(s);
                        double mt = (ot+it)/2;
                        auto xyz = road.get_xyz(s,mt,0);
                        outfile.write((char *) &road_id, sizeof(road_id));
                        outfile.write((char *) &lane_id, sizeof(lane_id));
                        outfile.write((char *) &roadlane_type, sizeof(roadlane_type));
                        outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
                        outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));

                        if (((int)s*10)%1000==0){

                            double ss = s;
                            for (int i=0;i<50;i++){
                                ss+=eps;
                            }
                            for (double tt = it; tt<mt; tt+=0.05){
                                ss+=eps;
                            }
                            for (int i=0;i<200;i++){
                                ss+=eps;
                            }
                            if (ss<=s_end){
                                ss = s;
                                ot = lane.outer_border.get(ss);
                                it = lane.inner_border.get(ss);
                                mt = (ot+it)/2;
                                for (int i=0;i<50;i++){
                                    auto xyz = road.get_xyz(ss,it,0);
                                    outfile.write((char *) &road_id, sizeof(road_id));
                                    outfile.write((char *) &lane_id, sizeof(lane_id));
                                    outfile.write((char *) &data_type, sizeof(data_type));
                                    outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
                                    outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));
                                    ot = lane.outer_border.get(ss);
                                    it = lane.inner_border.get(ss);
                                    mt = (ot+it)/2;
                                    ss+=eps;
                                }
                                ot = lane.outer_border.get(ss);
                                it = lane.inner_border.get(ss);
                                mt = (ot+it)/2;
                                for (double tt = it; tt>mt; tt-=0.05){
                                    auto xyz = road.get_xyz(ss,tt,0);
                                    outfile.write((char *) &road_id, sizeof(road_id));
                                    outfile.write((char *) &lane_id, sizeof(lane_id));
                                    outfile.write((char *) &data_type, sizeof(data_type));
                                    outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
                                    outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));
                                    ss+=eps;
                                    ot = lane.outer_border.get(ss);
                                    it = lane.inner_border.get(ss);
                                    mt = (ot+it)/2;
                                }
                                ot = lane.outer_border.get(ss);
                                it = lane.inner_border.get(ss);
                                mt = (ot+it)/2;
                                for (int i=0;i<200;i++){
                                    auto xyz = road.get_xyz(ss,mt,0);
                                    outfile.write((char *) &road_id, sizeof(road_id));
                                    outfile.write((char *) &lane_id, sizeof(lane_id));
                                    outfile.write((char *) &data_type, sizeof(data_type));
                                    outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
                                    outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));
                                    ot = lane.outer_border.get(ss);
                                    it = lane.inner_border.get(ss);
                                    mt = (ot+it)/2;
                                    ss+=eps;
                                }
                                data_type++;

                                ss = s;
                                ot = lane.outer_border.get(ss);
                                it = lane.inner_border.get(ss);
                                mt = (ot+it)/2;
                                for (int i=0;i<50;i++){
                                    auto xyz = road.get_xyz(ss,ot,0);
                                    outfile.write((char *) &road_id, sizeof(road_id));
                                    outfile.write((char *) &lane_id, sizeof(lane_id));
                                    outfile.write((char *) &data_type, sizeof(data_type));
                                    outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
                                    outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));
                                    ot = lane.outer_border.get(ss);
                                    it = lane.inner_border.get(ss);
                                    mt = (ot+it)/2;
                                    ss+=eps;
                                }
                                ot = lane.outer_border.get(ss);
                                it = lane.inner_border.get(ss);
                                mt = (ot+it)/2;
                                for (double tt = ot; tt<mt; tt+=0.05){
                                    auto xyz = road.get_xyz(ss,tt,0);
                                    outfile.write((char *) &road_id, sizeof(road_id));
                                    outfile.write((char *) &lane_id, sizeof(lane_id));
                                    outfile.write((char *) &data_type, sizeof(data_type));
                                    outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
                                    outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));
                                    ot = lane.outer_border.get(ss);
                                    it = lane.inner_border.get(ss);
                                    mt = (ot+it)/2;
                                    ss+=eps;
                                }
                                ot = lane.outer_border.get(ss);
                                it = lane.inner_border.get(ss);
                                mt = (ot+it)/2;
                                for (int i=0;i<200;i++){
                                    auto xyz = road.get_xyz(ss,mt,0);
                                    outfile.write((char *) &road_id, sizeof(road_id));
                                    outfile.write((char *) &lane_id, sizeof(lane_id));
                                    outfile.write((char *) &data_type, sizeof(data_type));
                                    outfile.write((char *) &xyz.at(0), sizeof(xyz.at(0)));
                                    outfile.write((char *) &xyz.at(1), sizeof(xyz.at(1)));
                                    ot = lane.outer_border.get(ss);
                                    it = lane.inner_border.get(ss);
                                    mt = (ot+it)/2;
                                    ss+=eps;
                                }
                                data_type++;
                            }
                        }
                    }
                    // printf("%.3f %.3f\n",xyz.at(0),xyz.at(0));
                }
            }
        }
    }
    printf("data_type: %d\n", data_type);

    outfile.close();

    printf("Finished, got %lu lane points\n", lane_pts.size());
    return 0;
}
