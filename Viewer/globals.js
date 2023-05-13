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


// UTM 52
const PROJ_STR = "+proj=utm +zone=52 +datum=WGS84 +units=m +no_defs +type=crs";

// Google Maps
// const PROJ_STR = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";

// Kakao Map
// const PROJ_STR = "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs";

var [GPS_REFERENCE_LAT,GPS_REFERENCE_LON ]= [36.7434901,127.1151129];
var [REF_X,REF_Y ]= proj4(PROJ_STR,[GPS_REFERENCE_LON,GPS_REFERENCE_LAT]);

var [VEHICLE_W,VEHICLE_L,VEHICLE_H] = [1.890,4.635,1.647];
var vehicle_box;
var VEHICLE_X = 0;
var VEHICLE_Y = 0;
var VEHICLE_YAW = 0;
var VEHICLE_LOG = [];
var log_idx = 0;