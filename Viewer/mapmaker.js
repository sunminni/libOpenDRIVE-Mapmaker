// Globals
var selectPredFlag = false;

var sel_road_id = null;
var sel_lanesec_s0 = null;
var sel_lane_id = null;
var sel_cp = null;

var NEW_ROAD_PARAMS = null;

var new_road_gui;
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

var map_filename = 'RandomRoad.xodr'
var map_filepath = './'+map_filename;
var handleRoad;

// Event Listeners
window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('click', onMouseClick, false);


function toggleRoadControls(){
    if (new_road_gui.domElement.style.display==="none"){
        new_road_gui.domElement.style.display = 'block';
    }
    else{
        new_road_gui.domElement.style.display = 'none';
    }
}

function writeXMLFile(){
    let body_dict = {};
    body_dict['filename'] = map_filename;
    body_dict['data'] = ModuleOpenDrive.save_map(OpenDriveMap);
    fetch('http://localhost:8000/save', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body_dict),
    }).then(()=>{fetch(map_filepath).then((file_data) => {
        file_data.text().then((file_text) => {
            loadFile(file_text, true);
            if (NEW_ROAD_PARAMS.road_id!==""){
                createHandleRoad();
            }
        });
    });});
}

function onKeyDown(e){
    console.log(e.key);
    if (NEW_ROAD_PARAMS.road_id!==""){
        if (e.key=='a'){
            ModuleOpenDrive.create_new_road(OpenDriveMap, NEW_ROAD_PARAMS);
            writeXMLFile();
        }
        if (e.key=='Escape'){
            toggleRoadControls();
            ModuleOpenDrive.write_handle_road_xml(OpenDriveMap,NEW_ROAD_PARAMS);
            scene.remove(road_network_mesh_new);
            writeXMLFile();
            NEW_ROAD_PARAMS.road_id="";
        }
        if (e.key=='Delete'){
            toggleRoadControls();
            ModuleOpenDrive.delete_road(OpenDriveMap,NEW_ROAD_PARAMS);
            scene.remove(road_network_mesh_new);
            writeXMLFile();
            NEW_ROAD_PARAMS.road_id="";
        }
    }
}

function onMouseClick(e){
    if (NEW_ROAD_PARAMS.road_id===""){
        if (sel_road_id!==null){
            console.log(sel_road_id);
            console.log(sel_lanesec_s0);
            console.log(sel_lane_id);
            NEW_ROAD_PARAMS.road_id = sel_road_id;
            createHandleRoad();
            toggleRoadControls();
            if(selectPredFlag){
                console.log(sel_road_id);
                console.log(sel_lanesec_s0);
                console.log(sel_lane_id);
                console.log(sel_cp);
                NEW_ROAD_PARAMS.predecessorIJ=false;
                NEW_ROAD_PARAMS.predecessorID=sel_road_id;
                NEW_ROAD_PARAMS.predecessorCP=sel_cp;
            }
            // updateNewRoad();
        }
    }
}

function removeNewRoad(){
    ModuleOpenDrive.remove_new_road(OpenDriveMap);
}

function updateControllerDisplay(){
    line_typeC.updateDisplay();
    road_lengthC.updateDisplay();
    xC.updateDisplay();
    yC.updateDisplay();
    hdgC.updateDisplay();
    if(line_typeC.getValue() == "line" && curvatureC!==null){
        curvatureC.remove();
        curvatureC = null;
    }
    if (line_typeC.getValue() == "arc" && curvatureC===null){
        curvatureC = geometry_folder.add(NEW_ROAD_PARAMS, 'curvature').step(0.00001).onChange(() => {updateHandleRoad();});
    }
    if (curvatureC!==null) curvatureC.updateDisplay();
    predetC.updateDisplay();
    predeiC.updateDisplay();
    predcpC.updateDisplay();
    succC.updateDisplay();
}

function createHandleRoad(){
    handleRoad = ModuleOpenDrive.get_road(OpenDriveMap,NEW_ROAD_PARAMS);
    updateControllerDisplay();
    drawRoad(handleRoad);
}

function updateHandleRoad(){
    if(line_typeC.getValue() == "line" && curvatureC!==null){
        console.log("line");
        curvatureC.remove();
        curvatureC = null;
    }
    if (line_typeC.getValue() == "arc" && curvatureC===null){
        console.log("arc");
        curvatureC = geometry_folder.add(NEW_ROAD_PARAMS, 'curvature').step(0.00001).onChange(() => {updateHandleRoad();});
    }
    if (curvatureC!==null && curvatureC.getValue()==0){
        curvatureC.setValue(0.00001);
    }
    ModuleOpenDrive.update_handle_road(handleRoad, NEW_ROAD_PARAMS);
    drawRoad(handleRoad);
}

// function createNewRoad(){
//     ModuleOpenDrive.create_new_road(OpenDriveMap, parseFloat(PARAMS.resolution));
//     updateNewRoad();
// }

// function updateNewRoad(){
//     const road_ids = ModuleOpenDrive.update_new_road(OpenDriveMap, NEW_ROAD_PARAMS);
//     let road = ModuleOpenDrive.get_road(OpenDriveMap,road_ids.get(0));
//     drawRoad(road);

    // for (let idx = 0; idx < road_ids.size(); idx++){
    //     let road = ModuleOpenDrive.get_road(OpenDriveMap,road_ids.get(idx));
    //     drawRoad(road);
    // }
// }

function drawRoad(road){
    scene.remove(road_network_mesh_new);
    const odr_road_network_mesh = ModuleOpenDrive.create_road_mesh(parseFloat(PARAMS.resolution),road);
    const odr_lanes_mesh_new = odr_road_network_mesh.lanes_mesh;
    const road_network_geom_new = get_geometry(odr_lanes_mesh_new);
    road_network_geom_new.attributes.color.array.fill(COLORS.road);
    for (const [vert_start_idx, _] of getStdMapEntries(odr_lanes_mesh_new.lane_start_indices)) {
        const vert_idx_interval = odr_lanes_mesh_new.get_idx_interval_lane(vert_start_idx);
        const vert_count = vert_idx_interval[1] - vert_idx_interval[0];
        const vert_start_idx_encoded = encodeUInt32(vert_start_idx);
        const attr_arr = new Float32Array(vert_count * 4);
        for (let i = 0; i < vert_count; i++)
            attr_arr.set(vert_start_idx_encoded, i * 4);
        road_network_geom_new.attributes.id.array.set(attr_arr, vert_idx_interval[0] * 4);
    }
    disposable_objs.push(road_network_geom_new);

    road_network_mesh_new = new THREE.Mesh(road_network_geom_new, road_network_material);
    
    road_network_mesh_new.renderOrder = 0;
    road_network_mesh_new.userData = { odr_road_network_mesh };
    road_network_mesh_new.matrixAutoUpdate = false;
    road_network_mesh_new.visible = !(PARAMS.view_mode == 'Outlines');
    scene.add(road_network_mesh_new);

    odr_lanes_mesh_new.delete();
}

function selectPred(){
    selectPredFlag = true;
}


function init_new_road_control(){
    NEW_ROAD_PARAMS = ModuleOpenDrive.init_NRP();

    new_road_gui = new dat.GUI();
    new_road_gui.domElement.classList.add('new_road_controls');
    new_road_gui.domElement.getElementsByClassName('close-button')[0].remove();
    new_road_gui.domElement.style.display = 'none';

    geometry_folder = new_road_gui.addFolder('Geometry');
    geometry_folder.open();

    line_typeC = geometry_folder.add(NEW_ROAD_PARAMS, 'line_type', { 'line' : 'line', 'arc' : 'arc' }).onChange(() => {updateHandleRoad();});
    road_lengthC = geometry_folder.add(NEW_ROAD_PARAMS, 'road_length', 1).step(0.001).onChange(() => {updateHandleRoad();});
    xC = geometry_folder.add(NEW_ROAD_PARAMS, 'x').step(0.001).onChange(() => {updateHandleRoad();});
    yC = geometry_folder.add(NEW_ROAD_PARAMS, 'y').step(0.001).onChange(() => {updateHandleRoad();});
    hdgC = geometry_folder.add(NEW_ROAD_PARAMS, 'hdg', -Math.PI*2, Math.PI*2, 0.001).onChange(() => {updateHandleRoad();});
    curvatureC = geometry_folder.add(NEW_ROAD_PARAMS, 'curvature', -0.1, 0.1, 0.001).onChange(() => {updateHandleRoad();});

    pred_folder = new_road_gui.addFolder('Predecessor');
    pred_folder.open();
    predetC = pred_folder.add(NEW_ROAD_PARAMS, 'predecessorIJ').onChange(() => {updateHandleRoad();}).name("Junction");
    predeiC = pred_folder.add(NEW_ROAD_PARAMS, 'predecessorID').onChange(() => {updateHandleRoad();}).name("ID");
    predcpC = pred_folder.add(NEW_ROAD_PARAMS, 'predecessorCP').onChange(() => {updateHandleRoad();}).name("Contact Point");
    predcpC.domElement.getElementsByTagName("input")[0].disabled = true;
    succC = new_road_gui.add(NEW_ROAD_PARAMS, 'successor').onChange(() => {updateHandleRoad();});

    predeiC.domElement.innerHTML = '<button onclick="event.stopPropagation();selectPred();">-1</button>';
    succC.domElement.innerHTML = '<button>-1</button>';
}