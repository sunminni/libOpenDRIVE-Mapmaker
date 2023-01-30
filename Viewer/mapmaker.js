// Globals
var newRoadMode = false;
var selectRoadMode = true;
var selectPredFlag = false;

var sel_road_id = null;
var sel_lanesec_s0 = null;
var sel_lane_id = null;
var sel_cp = null;

var NEW_ROAD_PARAMS = null;

var new_road_gui;
var road_lengthC;
var xC;
var yC;
var hdgC;
var pred_folder;
var predetC;
var predeiC;
var predcpC;
var succC;

var map_filename = 'test.xodr'
var map_filepath = './'+map_filename;
var handleRoad;

// Event Listeners
window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('click', onMouseClick, false);

function onKeyDown(e){
    console.log(e.key);
    if (e.key=='a'){
        newRoadMode=!newRoadMode;
        selectRoadMode = false;
        if (newRoadMode){
            new_road_gui.domElement.style.display = 'block';
            // createNewRoad();
        }
        else{
            new_road_gui.domElement.style.display = 'none';
            scene.remove(road_network_mesh_new);
            removeNewRoad();
        }
    }
    if (e.key=='g'){
        let save_data = ModuleOpenDrive.save_map(OpenDriveMap);
        fetch('http://localhost:8000/save', {
            method: 'POST',
            body: save_data,
        });
    }
    if (e.key=='Escape'){
        new_road_gui.domElement.style.display = 'none';
        scene.remove(road_network_mesh_new);
        writeHandleRoadXML();
        let save_data = ModuleOpenDrive.save_map(OpenDriveMap);
        fetch('http://localhost:8000/save', {
            method: 'POST',
            body: save_data,
        }).then(()=>{fetch(map_filepath).then((file_data) => {
            file_data.text().then((file_text) => {
                loadFile(file_text, true);
            });
        });});
    }
}

function onMouseClick(e){
    if (selectRoadMode){
        if (sel_road_id!==null){
            console.log(sel_road_id);
            console.log(sel_lanesec_s0);
            console.log(sel_lane_id);
            createHandleRoad(sel_road_id);
            new_road_gui.domElement.style.display = 'block';

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

function writeHandleRoadXML(){
    ModuleOpenDrive.write_handle_road_xml(OpenDriveMap,NEW_ROAD_PARAMS);
}

function removeNewRoad(){
    ModuleOpenDrive.remove_new_road(OpenDriveMap);
}

function updateControllerDisplay(){
    road_lengthC.updateDisplay();
    xC.updateDisplay();
    yC.updateDisplay();
    hdgC.updateDisplay();
    predetC.updateDisplay();
    predeiC.updateDisplay();
    predcpC.updateDisplay();
    succC.updateDisplay();
}

function createHandleRoad(road_id){
    handleRoad = ModuleOpenDrive.get_road(OpenDriveMap,road_id,NEW_ROAD_PARAMS);
    updateControllerDisplay();
    drawRoad(handleRoad);
}

function updateHandleRoad(){
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
    selectRoadMode = true;
}


function init_new_road_control(){
    NEW_ROAD_PARAMS = ModuleOpenDrive.init_NRP();

    new_road_gui = new dat.GUI();
    new_road_gui.domElement.classList.add('new_road_controls');
    new_road_gui.domElement.getElementsByClassName('close-button')[0].remove();
    new_road_gui.domElement.style.display = 'none';

    road_lengthC = new_road_gui.add(NEW_ROAD_PARAMS, 'road_length', 1).step(0.001).onChange(() => {updateHandleRoad();});
    xC = new_road_gui.add(NEW_ROAD_PARAMS, 'x').step(0.001).onChange(() => {updateHandleRoad();});
    yC = new_road_gui.add(NEW_ROAD_PARAMS, 'y').step(0.001).onChange(() => {updateHandleRoad();});
    hdgC = new_road_gui.add(NEW_ROAD_PARAMS, 'hdg', -Math.PI*2, Math.PI*2, 0.001).onChange(() => {updateHandleRoad();});

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