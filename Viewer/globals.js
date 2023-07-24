// Globals
const DEFAULT = "default";
const SELECTED = "road selected";
const CREATE_LINE_1 = "create line: set start point";
const CREATE_LINE_2 = "create line: set end point";
const CREATE_ARC_1 = "create arc: set start point";
const CREATE_ARC_2 = "create arc: set start direction";
const CREATE_ARC_3 = "create arc: set end point";
const EXTEND = "extend road: select road end";
const EXTEND_LINE = "extend road: line";
const EXTEND_ARC = "extend road: arc";
const CONNECT_1 = "connect roads: select starting road end";
const CONNECT_2 = "connect roads: select next road end";
const JUNCTION = "junctions";
const JUNCTION_1 = "create junction link: select in lane";
const JUNCTION_2 = "create junction link: select out lane";
const REFLINE = "select refline";
const LINK_ROAD_PRED = "select road for predecessor";
const LINK_ROAD_SUCC = "select road for successor";
const JUNCTION_EXTEND = "junction extend: select lane end";
const JUNCTION_EXTEND_LINE = "junction extend: line";
const JUNCTION_EXTEND_ARC = "junction extend: arc";
const SCREENSHOT_ADJUST = "adjust screenshot";

var arrow1 = null;
var link_arrows = [];
var junc_lines = [];
var MapmakerMode = "init";

var mouse_vec = new THREE.Vector3();
var mouse_pos = new THREE.Vector3();

var hover_road_id = null;
var hover_lanesec_s0 = null;
var hover_lane_id = null;
var hover_near_start = null;

var sel_road_id = null;
var sel_lanesec_s0 = null;
var sel_lane_id = null;
var sel_near_start = null;

var JUNCTION_DATA = {'junction_id':-1};
var junc_gui = null;
var junc_idC = null;
var junc_link_start_rid = null;
var junc_link_start_lid = null;
var junc_link_end_rid = null;
var junc_link_end_lid = null;

var road_gui = null;
var roadCs = {};
var road_predLaneLinksF = null;
var road_succLaneLinksF = null;
var road_laneOffsetF = null;
var road_laneOffsetCs = [];
var road_laneFs = [];
var road_laneCs = [];

var updateTimestamp = Date.now();

var files_gui = null;
var map_filename = null;
var map_folder = null;
var map_filepath = null;
var fetched_dict = {};
var first_load = true;

var handle_mesh = null;
var handle_reflines = null;
var handle_lanelines = null;

var preview_geometries = null;
var preview_mesh = null;
var preview_reflines = null;
var preview_lanelines = null;
var validPreview = false;

var lane_datas = {"-1":[0,0,0,3.5,0,0,0], "0":[0,0,0,3.5,0,0,0]}; //predecessor,successor,s,a,b,c,d
var lane_offset = [];
var map_offset_x = null;
var map_offset_y = null;
var mode_info = document.getElementById('mode_info');

var lines_dict = {};
var selected_line = null;
var selected_points = null;
var selected_line_id = -1;

var flip = false;


// utmk
// const PROJ_STR = "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43";

// UTM 52
// const PROJ_STR = "+proj=utm +zone=52 +datum=WGS84 +units=m +no_defs +type=crs";

// Google Maps
// const PROJ_STR = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";

// Kakao Map
// const PROJ_STR = "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs";

// Naver Map
const PROJ_STR = "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";

// var MAP_SELECT = "KATECH"
// var MAP_SELECT = "PANGYO"
var MAP_SELECT = "KCITY"
// var MAP_SELECT = "WATER"
var GPS_REFERENCE_LAT, GPS_REFERENCE_LON;
var CAMERA_OFFSET_X, CAMERA_OFFSET_Y, CAMERA_OFFSET_Z;
var SCREENSHOT_DX, SCREENSHOT_DY, SCREENSHOT_ROT, SCREENSHOT_SCALE;
var screenshot_mesh = null;
CAMERA_OFFSET_Z = 100;
var texture_loader = new THREE.TextureLoader();
let screenshot_filepath = null;
if (MAP_SELECT == "KATECH"){
    screenshot_filepath = 'map_screenshots/katech_satellite.png';
}
else if (MAP_SELECT == "WATER"){
    screenshot_filepath = 'map_screenshots/water_center.png';
}

// KATECH
if (MAP_SELECT == "KATECH"){
    [GPS_REFERENCE_LAT,GPS_REFERENCE_LON ]= [36.7434901,127.1151129];
    [CAMERA_OFFSET_X,CAMERA_OFFSET_Y ]= [700,-340];
    SCREENSHOT_ROT = -0.026;
    SCREENSHOT_SCALE = 0.1270;
    SCREENSHOT_DX = 297;
    SCREENSHOT_DY = -154.5;
}
else if (MAP_SELECT == "PANGYO"){
    [GPS_REFERENCE_LAT,GPS_REFERENCE_LON ]= [37.417733438073405,127.10221182505174];
    [CAMERA_OFFSET_X,CAMERA_OFFSET_Y ]= [0,0];
}
else if (MAP_SELECT == "KCITY"){
    [GPS_REFERENCE_LAT,GPS_REFERENCE_LON ]= [37.238323,126.76788];
    [CAMERA_OFFSET_X,CAMERA_OFFSET_Y ]= [500,500];
}
else if (MAP_SELECT == "WATER"){
    [GPS_REFERENCE_LAT,GPS_REFERENCE_LON ]= [37.465590,127.12433];
    [CAMERA_OFFSET_X,CAMERA_OFFSET_Y ]= [20,-100];
    // kako
    // SCREENSHOT_ROT = 0;
    // SCREENSHOT_SCALE = 0.2503;
    // SCREENSHOT_DX = -195.7;
    // SCREENSHOT_DY = -318.7;
    // naver
    // SCREENSHOT_ROT = 0;
    // SCREENSHOT_SCALE = 0.20579999999999993;
    // SCREENSHOT_DX = -195.30000000000004;
    // SCREENSHOT_DY = -333.2999999999999;

    //naver screenshot, kakao proj
    SCREENSHOT_ROT = 0;
    SCREENSHOT_SCALE = 0.20579999999999993;
    SCREENSHOT_DX = -207.09999999999937;
    SCREENSHOT_DY = -338.40000000000106;

    POINTS_OFFSET_X = -372;
    POINTS_OFFSET_Y = -616.2;
}

var [REF_X,REF_Y ]= proj4(PROJ_STR,[GPS_REFERENCE_LON,GPS_REFERENCE_LAT]);

var [VEHICLE_W,VEHICLE_L,VEHICLE_H] = [1.890,4.635,1.647];
var vehicle_box;
var target_boxes = [];
var VEHICLE_X = 0;
var VEHICLE_Y = 0;
var VEHICLE_YAW = 0;
// var VEHICLE_LOG = [];
var log_idx = 0;

var VIEW_MODE = false;