function getIntersection(x1,y1,hdg1,x2,y2,hdg2){

    if (hdg1==hdg2) return null;

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

function previewCreateArc1(){
    let from = new THREE.Vector3(PREVIEW_PARAMS[0].x, PREVIEW_PARAMS[0].y, 0);
    let to = new THREE.Vector3(mouse_pos.x,mouse_pos.y,0);
    let direction = to.clone().sub(from);
    arrow1 = new THREE.ArrowHelper(direction.normalize(), from, 50, 0xff0000, 10, 10);
    scene.add(arrow1);
}

function previewCreateArc2(){
    let xs = PREVIEW_PARAMS[0].x;
    let ys = PREVIEW_PARAMS[0].y;
    let xe = mouse_pos.x;
    let ye = mouse_pos.y;
    let start_hdg = PREVIEW_PARAMS[0].hdg;

    let start_m,start_b,m,b,xc,yc;
    let vert = "false";
    if (start_hdg==Math.PI/2 || start_hdg==-Math.PI/2){
        //vert up
        yc = ys;
        xc = (ys**2)+(xe**2)-(2*ys*ye)+(ye**2)-(xs**2);
        xc = xc / (-(2*xs)+(2*xe));
        vert = start_hdg==Math.PI/2 ? "up" : "down";
    }
    else if (start_hdg==0 || start_hdg==Math.PI || start_hdg==-Math.PI){
        //hori right
        xc = xs;
        yc = (xs**2)-(ys**2)-(2*xs*xe)+(xe**2)+(ye**2);
        yc = yc / (-(2*ys)+(2*ye));
        start_m = 0;
        start_b = ys;
    }
    else{
        start_m = Math.sin(start_hdg)/Math.cos(start_hdg);
        start_b = ys-start_m*xs;
        m = -1/start_m;
        b = ys-m*xs;
        xc = -(xs**2)+(2*ys*b)-(ys**2)+(xe**2)-(2*ye*b)+(ye**2);
        xc = xc / (-(2*xs)-(2*ys*m)+(2*xe)+(2*ye*m));
        yc = m*xc+b;
    }

    let radius = Math.hypot(xc-xs,yc-ys);

    if (radius == Number.POSITIVE_INFINITY || radius == Number.NEGATIVE_INFINITY) return;

    let dot = (xs-xc)*(xe-xc) + (ys-yc)*(ye-yc);
    let det = (xs-xc)*(ye-yc) - (ys-yc)*(xe-xc);
    let theta = null;

    if (vert=="up"){
        theta = Math.atan2(-det, -dot)+Math.PI;
        if (xe>xs){
            theta -= Math.PI*2;
        }
    }
    else if (vert=="down"){
        theta = Math.atan2(-det, -dot)+Math.PI;
        if (xe<xs){
            theta -= Math.PI*2;
        }
    }
    else{
        if (ye>start_m*xe+start_b){
            theta = Math.atan2(-det, -dot)+Math.PI;
            if (Math.abs(start_hdg)>Math.PI/2){
                theta -= Math.PI*2;
            }
        }
        else{
            theta = Math.atan2(-det, -dot)-Math.PI;
            if (Math.abs(start_hdg)>Math.PI/2){
                theta += Math.PI*2;
            }
        }
    }

    let road_length = Math.abs(theta*radius);
    let curvature = theta>0 ? 1/radius : -1/radius;
    
    PREVIEW_PARAMS[0].road_length =road_length;
    PREVIEW_PARAMS[0].curvature = curvature;
    ModuleOpenDrive.update_road(preview_road[0], PREVIEW_PARAMS[0]);
    preview_mesh = [drawRoadMesh(preview_road[0],preview_mesh[0]),null];
    validPreview = [true,false];
}

function previewCreateLine(){
    PREVIEW_PARAMS[0].road_length = Math.hypot(PREVIEW_PARAMS[0].x-mouse_pos.x, PREVIEW_PARAMS[0].y-mouse_pos.y);
    PREVIEW_PARAMS[0].hdg = Math.atan2(mouse_pos.y-PREVIEW_PARAMS[0].y,mouse_pos.x-PREVIEW_PARAMS[0].x);

    ModuleOpenDrive.update_road(preview_road[0], PREVIEW_PARAMS[0]);
    preview_mesh = [drawRoadMesh(preview_road[0],preview_mesh[0]),null];
    validPreview = [true,false];
}

function previewExtendLine(){
    PREVIEW_PARAMS[0].road_length = Math.hypot(PREVIEW_PARAMS[0].x-mouse_pos.x, PREVIEW_PARAMS[0].y-mouse_pos.y);

    ModuleOpenDrive.update_road(preview_road[0], PREVIEW_PARAMS[0]);
    preview_mesh = [drawRoadMesh(preview_road[0],preview_mesh[0]),null];
    validPreview = [true,false];
}

function previewLink(){
    let std_vec = ModuleOpenDrive.get_end(HANDLE_PARAMS);
    let x1 = std_vec.get(0);
    let y1 = std_vec.get(1);
    let hdg1 = std_vec.get(2);
    let m1 = Math.tan(hdg1);
    let b1 = y1-m1*x1;

    PREVIEW_PARAMS[0].road_id = sel_road_id;
    let linkRoad = ModuleOpenDrive.get_road_and_params(OpenDriveMap,PREVIEW_PARAMS[0]);
    let x2 = PREVIEW_PARAMS[0].x;
    let y2 = PREVIEW_PARAMS[0].y;
    let hdg2 = PREVIEW_PARAMS[0].hdg;
    let m2 = Math.tan(hdg2);
    let b2 = y1-m2*x1;

    m1 = Math.round(m1 * 1000) / 1000
    b1 = Math.round(b1 * 1000) / 1000
    m2 = Math.round(m2 * 1000) / 1000
    b2 = Math.round(b2 * 1000) / 1000

    if (m1==m2 && b1==b2){
        //road only
        console.log("road only");
        PREVIEW_PARAMS[0].x = x1;
        PREVIEW_PARAMS[0].y = y1;
        PREVIEW_PARAMS[0].hdg = hdg1;
        PREVIEW_PARAMS[0].line_type = "line";
        PREVIEW_PARAMS[0].road_length = Math.hypot(x2-x1, y2-y1);
        ModuleOpenDrive.update_road(preview_road[0], PREVIEW_PARAMS[0]);
        preview_mesh = [drawRoadMesh(preview_road[0],preview_mesh[0]),null];
        validPreview = [true,false];
        return;
    }

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
        //line + arc
        console.log("line + arc");
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
        //arc + line
        console.log("arc + line");
        PREVIEW_PARAMS[1].x = x2;
        PREVIEW_PARAMS[1].y = y2;
        PREVIEW_PARAMS[1].hdg = hdg2;
        PREVIEW_PARAMS[1].line_type = "line";
        PREVIEW_PARAMS[1].road_length = d2-d1;
        let tmp_vec = ModuleOpenDrive.get_end(PREVIEW_PARAMS[1]);
        let tmp_x = tmp_vec.get(0);
        let tmp_y = tmp_vec.get(1);
        PREVIEW_PARAMS[1].x = x2-(tmp_x-x2)
        PREVIEW_PARAMS[1].y = y2-(tmp_y-y2)

        PREVIEW_PARAMS[0].x = x1;
        PREVIEW_PARAMS[0].y = y1;
        PREVIEW_PARAMS[0].hdg = hdg1;
        PREVIEW_PARAMS[0].line_type = "arc";
        let c = Math.hypot(PREVIEW_PARAMS[1].x-x1, PREVIEW_PARAMS[1].y-y1);
        let theta = hdg2-hdg1;
        let radius = (c/2)/Math.sin(theta/2);
        PREVIEW_PARAMS[0].road_length = theta*radius;
        PREVIEW_PARAMS[0].curvature = 1/radius;
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

function calcMouseWorldPos(event){
    mouse_vec.set(
        ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
    mouse_vec.unproject( camera );
    mouse_vec.sub( camera.position ).normalize();
    mouse_pos.copy( camera.position ).add( mouse_vec.multiplyScalar( -camera.position.z / mouse_vec.z ) );
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

function afterModuleLoad(){
    HANDLE_PARAMS = ModuleOpenDrive.create_RP();
    PREVIEW_PARAMS = [ModuleOpenDrive.create_RP(),ModuleOpenDrive.create_RP()];

    new_road_gui = new dat.GUI();
    new_road_gui.domElement.classList.add('new_road_controls');
    new_road_gui.domElement.getElementsByClassName('close-button')[0].remove();
    new_road_gui.domElement.style.display = 'none';

    road_idC = new_road_gui.add(HANDLE_PARAMS, 'road_id').onChange(() => {updateHandleRoad();});

    geometry_folder = new_road_gui.addFolder('Geometry');
    geometry_folder.open();
    line_typeC = geometry_folder.add(HANDLE_PARAMS, 'line_type', { 'line' : 'line', 'arc' : 'arc' }).onChange(() => {updateHandleRoad();});
    road_lengthC = geometry_folder.add(HANDLE_PARAMS, 'road_length', 1).step(0.001).onChange(() => {updateHandleRoad();});
    xC = geometry_folder.add(HANDLE_PARAMS, 'x').step(0.001).onChange(() => {updateHandleRoad();});
    yC = geometry_folder.add(HANDLE_PARAMS, 'y').step(0.001).onChange(() => {updateHandleRoad();});
    hdgC = geometry_folder.add(HANDLE_PARAMS, 'hdg', -Math.PI*2, Math.PI*2, 0.001).onChange(() => {updateHandleRoad();});
    curvatureC = makeCurvatureC();

    setMode(DEFAULT);
}

function afterMapLoad(){

    for (let arrow of link_arrows){
        scene.remove(arrow);
    }

    preview_road = [ModuleOpenDrive.create_preview_road(OpenDriveMap,"-1"),
                    ModuleOpenDrive.create_preview_road(OpenDriveMap,"-2")];
    let std_vec = ModuleOpenDrive.get_road_arrows(OpenDriveMap);
    link_arrows = [];
    let road_points = {};
    for(let i=0;i<std_vec.size();i++){
        let road_id = std_vec.get(i).get(7);
        let junction = std_vec.get(i).get(6);
        let color = junction==-1 ? 0xff0000 : 0x00ffff;
        road_points[road_id] = [];
        for (let j=0;j<2;j++){
            let x = std_vec.get(i).get(j*3+0);
            let y = std_vec.get(i).get(j*3+1);
            let hdg = std_vec.get(i).get(j*3+2);
            road_points[road_id].push(x);
            road_points[road_id].push(y);
            let from = new THREE.Vector3(x, y, 0);
            let direction = new THREE.Vector3(Math.cos(hdg),Math.sin(hdg),0);
            road_points[road_id].push(direction);
            if (j==0){
                from.add(direction);
            }
            else{
                direction.multiplyScalar(2);
                j==0?from.add(direction):from.sub(direction);
                direction.multiplyScalar(0.5);
            }
            let arrow = new THREE.ArrowHelper(direction, from, 1, color, 1, 1);
            arrow.line.material.linewidth = 5;
            scene.add(arrow);
            link_arrows.push(arrow);
        }
        road_points[road_id].push(std_vec.get(i).get(8));
        road_points[road_id].push(std_vec.get(i).get(9));
    }

    for (const [key, value] of Object.entries(road_points)) {
        console.log(key, value);
        if (value[6]!=-1){
            //pred
            let my_start_x = road_points[key][0];
            let my_start_y = road_points[key][1];
            let my_start_dir = road_points[key][2];
            let pred_end_x = road_points[value[6]][3];
            let pred_end_y = road_points[value[6]][4];
            let pred_end_dir = road_points[value[6]][5];
            let from = new THREE.Vector3(my_start_x, my_start_y, 0);
            let to = new THREE.Vector3(pred_end_x, pred_end_y, 0);
            to.sub(pred_end_dir);
            let direction = to.clone().sub(from);
            let length = direction.length();
            let arrow = new THREE.ArrowHelper(direction.normalize(), from, length, 0xffff00, 1, 1);
            arrow.line.material.linewidth = 5;
            scene.add(arrow);
            link_arrows.push(arrow);
        }
        if (value[7]!=-1){
            //succ
            let my_end_x = road_points[key][3];
            let my_end_y = road_points[key][4];
            let my_end_dir = road_points[key][5];
            let succ_start_x = road_points[value[7]][0];
            let succ_start_y = road_points[value[7]][1];
            let succ_start_dir = road_points[value[7]][2];
            let from = new THREE.Vector3(my_end_x, my_end_y, 0);
            let to = new THREE.Vector3(succ_start_x, succ_start_y, 0);
            to.add(succ_start_dir);
            let direction = to.clone().sub(from);
            let length = direction.length();
            let arrow = new THREE.ArrowHelper(direction.normalize(), from, length, 0xffff00, 1, 1);
            arrow.line.material.linewidth = 5;
            scene.add(arrow);
            link_arrows.push(arrow);
        }
    }


        // if (std_vec.get(i).get(7) == 1){
        //     let pred_x = std_vec.get(i).get(8);
        //     let pred_y = std_vec.get(i).get(9);
        //     let x = std_vec.get(i).get(0);
        //     let y = std_vec.get(i).get(1);
        //     let hdg = std_vec.get(i).get(2);
        //     let from = new THREE.Vector3(x, y, 0);
        //     let to = new THREE.Vector3(pred_x, pred_y, 0);
        //     let direction = new THREE.Vector3(Math.cos(hdg),Math.sin(hdg),0);
        //     let arrow = new THREE.ArrowHelper(direction, from, 1, 0xffff00, 1, 1);
        //     arrow.line.material.linewidth = 5;
        //     scene.add(arrow);
        //     link_arrows.push(arrow);

        // }
        // if (std_vec.get(i).get(10) == 1){
        //     let succ_x = std_vec.get(i).get(11);
        //     let succ_y = std_vec.get(i).get(12);
        // }
        // console.log(predecessor,successor);
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
            if (MapmakerMode === SELECTED){
                createHandleRoad();
            }
        });
    });});
}

function makeCurvatureC(){
    return geometry_folder.add(HANDLE_PARAMS, 'curvature', -0.1, 0.1, 0.001).onChange(() => {updateHandleRoad();});
}


function createHandleRoad(){
    handle_road = ModuleOpenDrive.get_road_and_params(OpenDriveMap,HANDLE_PARAMS);
    updateControllerDisplay();
    handle_mesh = drawRoadMesh(handle_road,handle_mesh);
}

function updateHandleRoad(){
    let curTimestamp = Date.now();
    if (curTimestamp - updateTimestamp < 10){
        return;
    }
    else{
        updateTimestamp = curTimestamp;
    }

    if(line_typeC.getValue() == "line" && curvatureC!==null){
        console.log("line");
        curvatureC.remove();
        curvatureC = null;
    }
    if (line_typeC.getValue() == "arc" && curvatureC===null){
        console.log("arc");
        curvatureC = makeCurvatureC();
    }
    if (curvatureC!==null && curvatureC.getValue()==0){
        curvatureC.setValue(0.001);
    }
    ModuleOpenDrive.update_road(handle_road, HANDLE_PARAMS);
    handle_mesh = drawRoadMesh(handle_road,handle_mesh);
}
