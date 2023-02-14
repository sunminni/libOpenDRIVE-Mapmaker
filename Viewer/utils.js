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
    let from = new THREE.Vector3(g_x1, g_y1, 0);
    let to = new THREE.Vector3(mouse_pos.x,mouse_pos.y,0);
    let direction = to.clone().sub(from);
    arrow1 = new THREE.ArrowHelper(direction.normalize(), from, 10, 0xff0000, 3, 3);
    scene.add(arrow1);
}

function previewCreateArc2(){
    let xs = g_x1;
    let ys = g_y1;
    let xe = mouse_pos.x;
    let ye = mouse_pos.y;
    let start_hdg = g_hdg1;

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
    
    g_len1 = road_length;
    g_cur1 = curvature;

    validPreview = g_len1>0.2 && g_cur1!=0;
}

function previewCreateLine(){
    g_len1 = Math.hypot(g_x1-mouse_pos.x, g_y1-mouse_pos.y);
    g_hdg1 = Math.atan2(mouse_pos.y-g_y1,mouse_pos.x-g_x1);
    validPreview = g_len1>0.2;
}

function previewExtendLine(){
    g_len1 = Math.hypot(g_x1-mouse_pos.x, g_y1-mouse_pos.y);
    validPreview = g_len1>0.2;
}

function previewRoadLink(){
    let std_vec = ModuleOpenDrive.get_end(OpenDriveMap,sel_road_id,sel_lane_id);
    g_x1 = std_vec.get(0);
    g_y1 = std_vec.get(1);
    g_hdg1 = std_vec.get(2);

    let m1 = Math.tan(g_hdg1);
    let b1 = g_y1-m1*g_x1;

    let std_vec2 = ModuleOpenDrive.get_start(OpenDriveMap,hover_road_id,hover_lane_id);
    let x2 = std_vec2.get(0);
    let y2 = std_vec2.get(1);
    let hdg2 = std_vec2.get(2);
    let m2 = Math.tan(hdg2);
    let b2 = g_y1-m2*g_x1;

    m1 = Math.round(m1 * 1000) / 1000
    b1 = Math.round(b1 * 1000) / 1000
    m2 = Math.round(m2 * 1000) / 1000
    b2 = Math.round(b2 * 1000) / 1000

    if (m1==m2 && b1==b2){
        //road only
        console.log("road only");
        g_two_geo = false;
        g_isarc1 = false;
        g_len1 = Math.hypot(x2-g_x1, y2-g_y1);
        validPreview = g_len1>0.2;
        return;
    }

    let intersection = getIntersection(g_x1,g_y1,g_hdg1,x2,y2,hdg2);
    console.log(intersection);
    if (intersection===null) return;
    let [xi,yi] = intersection;

    let d1 = Math.hypot(xi-g_x1, yi-g_y1);
    let d2 = Math.hypot(xi-x2, yi-y2);

    d1 = Math.round(d1 * 1000) / 1000
    d2 = Math.round(d2 * 1000) / 1000

    if (d2<d1){
        //line + arc
        console.log("line + arc");
        g_two_geo = true;
        g_isarc1 = false;
        g_isarc2 = true;

        g_len1 = d1-d2;
        let tmp_vec = ModuleOpenDrive.calc_end("line",g_x1,g_y1,g_hdg1,g_len1,0);
        g_x2 = tmp_vec.get(0);
        g_y2 = tmp_vec.get(1);
        g_hdg2 = tmp_vec.get(2);
        let c = Math.hypot(g_x2-x2, g_y2-y2);
        let theta = hdg2-g_hdg1;
        let radius = (c/2)/Math.sin(theta/2);
        g_len2 = theta*radius;
        g_cur2 = 1/radius;
        validPreview = g_len1>0.2 && g_len2>0.2 && g_cur2!=0;
        return;
    }
    else if (d1<d2){
        //arc + line
        console.log("arc + line");
        g_two_geo = true;
        g_isarc1 = true;
        g_isarc2 = false;

        g_hdg2 = hdg2;
        g_len2 = d2-d1;
        let tmp_vec = ModuleOpenDrive.calc_end("line",x2,y2,g_hdg2,g_len2,0);
        let tmp_x = tmp_vec.get(0);
        let tmp_y = tmp_vec.get(1);
        g_x2 = x2-(tmp_x-x2)
        g_y2 = y2-(tmp_y-y2)

        let c = Math.hypot(g_x2-g_x1,g_y2-g_y1);
        let theta = g_hdg2-g_hdg1;
        let radius = (c/2)/Math.sin(theta/2);
        g_len1 = theta*radius;
        g_cur1 = 1/radius;
        validPreview = g_len1>0.2 && g_len2>0.2 && g_cur1!=0;
        return;
    }
    else{
        //arc only
        console.log("arc only");
        g_two_geo = false;
        g_isarc1 = true;
        let c = Math.hypot(x2-g_x1, y2-g_y1);
        let theta = hdg2-g_hdg1;
        let radius = (c/2)/Math.sin(theta/2);
        g_len1 = theta*radius;
        g_cur1 = 1/radius;
        validPreview = g_len1>0.2 && g_cur1!=0;
        return;
    }
}

function previewJuncLink(){
    console.log("previewJuncLink");
    
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
    junc_gui = new dat.GUI();
    junc_gui.domElement.classList.add('junc_controls');
    junc_gui.domElement.getElementsByClassName('close-button')[0].remove();
    junc_gui.domElement.style.display = 'none';

    setMode(DEFAULT);

    // let image_loader = new THREE.TextureLoader();
    // let image_material = new THREE.MeshLambertMaterial({
    //     map: image_loader.load('songdo.png')
    // });

    // let image_geometry = new THREE.PlaneGeometry(200, 200*.75);
    // let image_mesh = new THREE.Mesh(image_geometry, image_material);
    // image_mesh.position.set(0,0,0)
    // scene.add(image_mesh);
}

function afterMapLoad(){

    for (let arrow of link_arrows){
        scene.remove(arrow);
    }
    preview_road = ModuleOpenDrive.create_preview_road(OpenDriveMap,"-1");
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

    if (junc_idC !== null){
        junc_idC.remove();
    }
    let junctions = ModuleOpenDrive.get_junction_ids(OpenDriveMap);
    junctions_dict = {}
    for(let i=0;i<junctions.size();i++){
        console.log(junctions.get(i));
        junctions_dict[junctions.get(i)] = junctions.get(i);
    }

    junc_idC = junc_gui.add(JUNCTION_DATA, 'junction_id', junctions_dict).onChange(()=>{updateCurJunction()});
    if (junctions.size()>0)
        junc_idC.setValue(junctions.get(0));

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

function createHandleRoad(){
    handle_road = ModuleOpenDrive.get_road(OpenDriveMap,sel_road_id);
    handle_mesh = drawRoadMesh(handle_road,handle_mesh);
}

function updateCurJunction(){
    console.log("updateCurJunction");
    
}
