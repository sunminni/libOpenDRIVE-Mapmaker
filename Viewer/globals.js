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

var updateTimestamp = Date.now();

var files_gui = null;
var map_filename = null;
var map_folder = null;
var map_filepath = null;
var fetched_dict = {};
var first_load = true;

var handle_mesh = null;

var preview_geometries = null;
var preview_mesh = null;
var preview_reflines = null;
var preview_lanelines = null;
var validPreview = false;

var lane_widths = {"-1":3.5, "0":0};
var map_offset_x = 999999999;
var map_offset_y = 999999999;
var mode_info = document.getElementById('mode_info');

var lines_dict = {};
var selected_line = null;
var selected_points = null;