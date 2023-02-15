// Globals
const CREATE_LINE_1 = "create line: set start point";
const CREATE_LINE_2 = "create line: set end point";
const DEFAULT = "default";
const EXTEND = "extend road: select road end";
const EXTEND_ROAD_LINE = "extend road: line";
const CONNECT_1 = "connect roads: select starting road end";
const CONNECT_2 = "connect roads: select next road end";
const SELECTED = "road selected";
const CREATE_ARC_1 = "create arc: set start point";
const CREATE_ARC_2 = "create arc: set start direction";
const CREATE_ARC_3 = "create arc: set end point";
const EXTEND_ARC = "extend road: arc";
const JUNCTION = "junctions";
const JUNCTION_1 = "create junction link: select in lane";
const JUNCTION_2 = "create junction link: select out lane";

var arrow1 = null;
var link_arrows = [];
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

var updateTimestamp = Date.now();

var map_filename = 'RandomRoad.xodr'
var map_filepath = './'+map_filename;

var handle_road = null;
var handle_mesh = null;

var preview_road = null;
var preview_mesh = null;
var validPreview = false;

var g_isarc1 = false;
var g_x1 = 0;
var g_y1 = 0;
var g_hdg1 = 0;
var g_len1 = 0;
var g_cur1 = 0;
var g_two_geo = false;
var g_isarc2 = false;
var g_x2 = 0;
var g_y2 = 0;
var g_hdg2 = 0;
var g_len2 = 0;
var g_cur2 = 0;

var g_start_lane = -1;
var g_end_lane = 0;

var mode_info = document.getElementById('mode_info');
