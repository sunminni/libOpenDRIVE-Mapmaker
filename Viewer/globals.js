// Globals
const CREATE_LINE_1 = "create line: set start point";
const CREATE_LINE_2 = "create line: set end point";
const DEFAULT = "default";
const EXTEND_ROAD_LINE = "extend road: line";
const CONNECT = "connect roads: select next road";
const SELECTED = "road selected";
const CREATE_ARC_1 = "create arc: set start point";
const CREATE_ARC_2 = "create arc: set start direction";
const CREATE_ARC_3 = "create arc: set end point";
const EXTEND_ARC = "extend road: arc";

var arrow1 = null;
var link_arrows = [];

var MapmakerMode = "init";

var mouse_vec = new THREE.Vector3();
var mouse_pos = new THREE.Vector3();

var sel_road_id = null;
var sel_lanesec_s0 = null;
var sel_lane_id = null;
var sel_cp = null;

var new_road_gui;
var road_idC;
var line_typeC;
var road_lengthC;
var xC;
var yC;
var hdgC;
var curvatureC;
var geometry_folder;
var pred_folder;
var predetC;
var predeiC;
var predcpC;
var succC;

var updateTimestamp = Date.now();

var map_filename = 'RandomRoad.xodr'
var map_filepath = './'+map_filename;

var HANDLE_PARAMS = null;
var handle_road = null;
var handle_mesh = null;

var PREVIEW_PARAMS = [null,null];
var preview_road = [null,null];
var preview_mesh = [null,null];
var validPreview = [false,false];

var mode_info = document.getElementById('mode_info');
