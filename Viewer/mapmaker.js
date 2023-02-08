// Globals
var selectMode = "road";

var sel_road_id = null;
var sel_lanesec_s0 = null;
var sel_lane_id = null;
var sel_cp = null;

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

var HANDLE_PARAMS = null;
var handle_road = null;
var handle_mesh = null;

var PREVIEW_PARAMS = [null,null];
var preview_road = [null,null];
var preview_mesh = [null,null];
var validPreview = [false,false];

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
            if (selectMode === "selected"){
                createHandleRoad();
            }
        });
    });});
}

function getIntersection(x1,y1,hdg1,x2,y2,hdg2){

    if (hdg1==hdg2) return null;

    // if (hdg1%Math.PI==0 && hdg2%Math.PI==0)
    //     //two hori
    //     return null;
    // if ((hdg1%Math.PI!=0 && hdg1%(Math.PI/2)==0)&&(hdg2%Math.PI!=0 && hdg2%(Math.PI/2)==0))
    //     //two vert
    //     return null;

    let xi = null;
    let yi = null;

    if (hdg1%(Math.PI/2)==0){
        if (hdg1%Math.PI==0){
            //hori
            yi = y1;
            let m2 = Math.tan(hdg2);
            let b2 = y2-m2*x2;
            xi = (yi-b2)/m2
        }
        else{
            //vert
            xi = x1;
            let m2 = Math.tan(hdg2);
            let b2 = y2-m2*x2;
            yi = m2*xi+b2;
        }
    }
    else if (hdg2%(Math.PI/2)==0){
        if (hdg2%Math.PI==0){
            //hori
            yi = y2;
            let m1 = Math.tan(hdg1);
            let b1 = y1-m1*x1;
            xi = (yi-b1)/m1
        }
        else{
            //vert
            xi = x2;
            let m1 = Math.tan(hdg1);
            let b1 = y1-m1*x1;
            yi = m1*xi+b1;
        }
    }
    else{
        let m1 = Math.tan(hdg1);
        let b1 = y1-m1*x1;
        let m2 = Math.tan(hdg2);
        let b2 = y2-m2*x2;
        xi = (b2-b1)/(m1-m2);
        yi = m1*xi+b1;
        console.log("m1 "+m1);
        console.log("m2 "+m2);
    }

    if (hdg1%(2*Math.PI)==0){
        //hori right
        if (xi<x1) return null;
    }
    else if (hdg1%Math.PI==0){
        //hori left
        if (xi>x1) return null;
    }
    else if (hdg1==Math.PI/2 || hdg1==-3*Math.PI/2){
        //vert up
        if (yi<y1) return null;
    }
    else if (hdg1==-Math.PI/2 || hdg1==3*Math.PI/2){
        //vert down
        if (yi>y1) return null;
    }
    else if ((hdg1>0 && hdg1<Math.PI) || hdg1<-Math.PI){
        if (yi<y1) return null;
    }
    else if (hdg1>Math.PI || (hdg1<0 && hdg1>-Math.PI )){
        if (yi>y1) return null;
    }


    if (hdg2%(2*Math.PI)==0){
        //hori right
        if (xi>x2) return null;
    }
    else if (hdg2%Math.PI==0){
        //hori left
        if (xi<x2) return null;
    }
    else if (hdg2==Math.PI/2 || hdg2==-3*Math.PI/2){
        //vert up
        if (yi>y2) return null;
    }
    else if (hdg2==-Math.PI/2 || hdg2==3*Math.PI/2){
        //vert down
        if (yi<y2) return null;
    }
    else if ((hdg2>0 && hdg2<Math.PI) || hdg2<-Math.PI){
        if (yi>y2) return null;
    }
    else if (hdg2>Math.PI || (hdg2<0 && hdg2>-Math.PI )){
        if (yi<y2) return null;
    }
    

    return [xi,yi];
}

function previewLink(){
    scene.remove(preview_mesh[0]);
    scene.remove(preview_mesh[1]);
    validPreview = [false,false];

    // console.log(HANDLE_PARAMS.road_id+"+"+sel_road_id);
    let std_vec = ModuleOpenDrive.get_end(HANDLE_PARAMS);
    let x1 = std_vec.get(0);
    let y1 = std_vec.get(1);
    let hdg1 = std_vec.get(2);
    PREVIEW_PARAMS[0].road_id = sel_road_id;
    let linkRoad = ModuleOpenDrive.get_road(OpenDriveMap,PREVIEW_PARAMS[0]);
    let x2 = PREVIEW_PARAMS[0].x;
    let y2 = PREVIEW_PARAMS[0].y;
    let hdg2 = PREVIEW_PARAMS[0].hdg;

    preview_road = [ModuleOpenDrive.get_road(OpenDriveMap,PREVIEW_PARAMS[0]),
                    ModuleOpenDrive.get_road(OpenDriveMap,PREVIEW_PARAMS[0])];

    let intersection = getIntersection(x1,y1,hdg1,x2,y2,hdg2);
    console.log(intersection);
    if (intersection===null) return;
    let [xi,yi] = intersection;

    let d1 = Math.hypot(xi-x1, yi-y1);
    let d2 = Math.hypot(xi-x2, yi-y2);

    d1 = Math.round(d1 * 1000) / 1000
    d2 = Math.round(d2 * 1000) / 1000

    arc_only = false;
    if (d2<d1){
        //extend 1 then arc
        console.log("extend 1 then arc");
        PREVIEW_PARAMS[0].x = x1;
        PREVIEW_PARAMS[0].y = y1;
        PREVIEW_PARAMS[0].hdg = hdg1;
        PREVIEW_PARAMS[0].line_type = "line";
        PREVIEW_PARAMS[0].road_length = d1-d2;

        let tmp_vec = ModuleOpenDrive.get_end(PREVIEW_PARAMS[0]);
        PREVIEW_PARAMS[1].x = tmp_vec.get(0);
        PREVIEW_PARAMS[1].y = tmp_vec.get(1);
        PREVIEW_PARAMS[1].hdg = tmp_vec.get(2);
        PREVIEW_PARAMS[1].line_type = "arc";
        let c = Math.hypot(PREVIEW_PARAMS[1].x-x2, PREVIEW_PARAMS[1].y-y2);
        let theta = hdg2-hdg1;
        let radius = (c/2)/Math.sin(theta/2);
        PREVIEW_PARAMS[1].road_length = theta*radius;
        PREVIEW_PARAMS[1].curvature = 1/radius;
    }
    else if (d1<d2){
        //arc then extend
        console.log("arc then extend");
        PREVIEW_PARAMS[0].x = x2;
        PREVIEW_PARAMS[0].y = y2;
        PREVIEW_PARAMS[0].hdg = hdg2;
        PREVIEW_PARAMS[0].line_type = "line";
        PREVIEW_PARAMS[0].road_length = d2-d1;
        let tmp_vec = ModuleOpenDrive.get_end(PREVIEW_PARAMS[0]);
        let tmp_x = tmp_vec.get(0);
        let tmp_y = tmp_vec.get(1);
        PREVIEW_PARAMS[0].x = x2-(tmp_x-x2)
        PREVIEW_PARAMS[0].y = y2-(tmp_y-y2)

        PREVIEW_PARAMS[1].x = x1;
        PREVIEW_PARAMS[1].y = y1;
        PREVIEW_PARAMS[1].hdg = hdg1;
        PREVIEW_PARAMS[1].line_type = "arc";
        let c = Math.hypot(PREVIEW_PARAMS[0].x-x1, PREVIEW_PARAMS[0].y-y1);
        let theta = hdg2-hdg1;
        let radius = (c/2)/Math.sin(theta/2);
        PREVIEW_PARAMS[1].road_length = theta*radius;
        PREVIEW_PARAMS[1].curvature = 1/radius;
    }
    else{
        //arc only
        arc_only = true;
        console.log("arc only");
        PREVIEW_PARAMS[0].x = x1;
        PREVIEW_PARAMS[0].y = y1;
        PREVIEW_PARAMS[0].hdg = hdg1;
        PREVIEW_PARAMS[0].line_type = "arc";
        let c = Math.hypot(x2-x1, y2-y1);
        let theta = hdg2-hdg1;
        let radius = (c/2)/Math.sin(theta/2);
        PREVIEW_PARAMS[0].road_length = theta*radius;
        PREVIEW_PARAMS[0].curvature = 1/radius;

    }

    ModuleOpenDrive.update_road(preview_road[0], PREVIEW_PARAMS[0]);
    if (!arc_only){
        ModuleOpenDrive.update_road(preview_road[1], PREVIEW_PARAMS[1]);
    }

    if (!arc_only){
        preview_mesh = [drawRoadMesh(preview_road[0],preview_mesh[0]),drawRoadMesh(preview_road[1],preview_mesh[1])];
        validPreview = [true,true];
    }
    else{
        preview_mesh = [drawRoadMesh(preview_road[0],preview_mesh[0]),null];
        validPreview = [true,false];
    }
}

function onKeyDown(e){
    console.log(e.key);
    if (selectMode === "selected"){
        if (e.key=='a'){
            ModuleOpenDrive.extend_road(OpenDriveMap, HANDLE_PARAMS);
            writeXMLFile();
        }
        if (e.key=='l'){
            selectMode = "link";
        }
        if (e.key=='Escape'){
            toggleRoadControls();
            ModuleOpenDrive.write_road_xml(OpenDriveMap, HANDLE_PARAMS);
            scene.remove(handle_mesh);
            writeXMLFile();
            selectMode = "road";
        }
        if (e.key=='Delete'){
            toggleRoadControls();
            ModuleOpenDrive.delete_road(OpenDriveMap, HANDLE_PARAMS);
            scene.remove(handle_mesh);
            writeXMLFile();
            selectMode = "road";
        }
    }
    else if (selectMode === "link"){
        if (e.key=='Escape'){
            selectMode = "selected";
        }
    }
    else if (selectMode === "predecessor"){
        if (e.key=='Escape'){
            selectMode = "selected";
        }
    }
    else if (selectMode === "road"){

    }
}

function onMouseClick(e){
    if (sel_road_id!==null){
        if (selectMode === "road"){
            console.log(sel_road_id);
            console.log(sel_lanesec_s0);
            console.log(sel_lane_id);
            HANDLE_PARAMS.road_id = sel_road_id;
            createHandleRoad();
            toggleRoadControls();
            selectMode = "selected";
        }
        else if (selectMode === "predecessor"){
            console.log(sel_road_id);
            console.log(sel_lanesec_s0);
            console.log(sel_lane_id);
            console.log(sel_cp);
            HANDLE_PARAMS.predecessorIJ=false;
            HANDLE_PARAMS.predecessorID=sel_road_id;
            HANDLE_PARAMS.predecessorCP=sel_cp;
            selectMode = "selected";
        }
        else if (selectMode === "link"){
            if (validPreview[0]){
                //make roads
                ModuleOpenDrive.add_road(OpenDriveMap, PREVIEW_PARAMS[0]);
                if (validPreview[1]){
                    ModuleOpenDrive.add_road(OpenDriveMap, PREVIEW_PARAMS[1]);
                }
                writeXMLFile();
                scene.remove(handle_mesh);
                scene.remove(preview_mesh[0]);
                scene.remove(preview_mesh[1]);
                toggleRoadControls();
                selectMode = "road";
            }
        }
    }
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
        curvatureC = geometry_folder.add(HANDLE_PARAMS, 'curvature', -0.1, 0.1, 0.001).onChange(() => {updateHandleRoad();});
    }
    if (curvatureC!==null) curvatureC.updateDisplay();
    predetC.updateDisplay();
    predeiC.updateDisplay();
    predcpC.updateDisplay();
    succC.updateDisplay();
}


function createHandleRoad(){
    handle_road = ModuleOpenDrive.get_road(OpenDriveMap,HANDLE_PARAMS);
    updateControllerDisplay();
    handle_mesh = drawRoadMesh(handle_road,handle_mesh);
}

function updateHandleRoad(){
    if(line_typeC.getValue() == "line" && curvatureC!==null){
        console.log("line");
        curvatureC.remove();
        curvatureC = null;
    }
    if (line_typeC.getValue() == "arc" && curvatureC===null){
        console.log("arc");
        curvatureC = geometry_folder.add(HANDLE_PARAMS, 'curvature', -0.1, 0.1, 0.001).onChange(() => {updateHandleRoad();});
    }
    if (curvatureC!==null && curvatureC.getValue()==0){
        curvatureC.setValue(0.00001);
    }
    ModuleOpenDrive.update_road(handle_road, HANDLE_PARAMS);
    handle_mesh = drawRoadMesh(handle_road,handle_mesh);
}

function drawRoadMesh(road,mesh){
    scene.remove(mesh);
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

    mesh = new THREE.Mesh(road_network_geom_new, road_network_material);
    
    mesh.renderOrder = 0;
    mesh.userData = { odr_road_network_mesh };
    mesh.matrixAutoUpdate = false;
    mesh.visible = !(PARAMS.view_mode == 'Outlines');
    scene.add(mesh);

    odr_lanes_mesh_new.delete();
    return mesh;
}

function selectPred(){
    selectMode = "predecessor";
}


function init_new_road_control(){
    HANDLE_PARAMS = ModuleOpenDrive.create_RP();
    PREVIEW_PARAMS = [ModuleOpenDrive.create_RP(),ModuleOpenDrive.create_RP()];

    new_road_gui = new dat.GUI();
    new_road_gui.domElement.classList.add('new_road_controls');
    new_road_gui.domElement.getElementsByClassName('close-button')[0].remove();
    new_road_gui.domElement.style.display = 'none';

    geometry_folder = new_road_gui.addFolder('Geometry');
    geometry_folder.open();

    line_typeC = geometry_folder.add(HANDLE_PARAMS, 'line_type', { 'line' : 'line', 'arc' : 'arc' }).onChange(() => {updateHandleRoad();});
    road_lengthC = geometry_folder.add(HANDLE_PARAMS, 'road_length', 1).step(0.001).onChange(() => {updateHandleRoad();});
    xC = geometry_folder.add(HANDLE_PARAMS, 'x').step(0.001).onChange(() => {updateHandleRoad();});
    yC = geometry_folder.add(HANDLE_PARAMS, 'y').step(0.001).onChange(() => {updateHandleRoad();});
    hdgC = geometry_folder.add(HANDLE_PARAMS, 'hdg', -Math.PI*2, Math.PI*2, 0.001).onChange(() => {updateHandleRoad();});
    curvatureC = geometry_folder.add(HANDLE_PARAMS, 'curvature', -0.1, 0.1, 0.001).onChange(() => {updateHandleRoad();});

    pred_folder = new_road_gui.addFolder('Predecessor');
    pred_folder.open();
    predetC = pred_folder.add(HANDLE_PARAMS, 'predecessorIJ').onChange(() => {updateHandleRoad();}).name("Junction");
    predeiC = pred_folder.add(HANDLE_PARAMS, 'predecessorID').onChange(() => {updateHandleRoad();}).name("ID");
    predcpC = pred_folder.add(HANDLE_PARAMS, 'predecessorCP').onChange(() => {updateHandleRoad();}).name("Contact Point");
    predcpC.domElement.getElementsByTagName("input")[0].disabled = true;
    succC = new_road_gui.add(HANDLE_PARAMS, 'successor').onChange(() => {updateHandleRoad();});

    predeiC.domElement.innerHTML = '<button onclick="event.stopPropagation();selectPred();">-1</button>';
    succC.domElement.innerHTML = '<button>-1</button>';
}