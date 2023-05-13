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
    let from = new THREE.Vector3(preview_geometries.get(0).get(1), preview_geometries.get(0).get(2), 0);
    let to = new THREE.Vector3(mouse_pos.x,mouse_pos.y,0);
    let direction = to.clone().sub(from);
    arrow1 = new THREE.ArrowHelper(direction.normalize(), from, 10, 0xff0000, 3, 3);
    arrow1.line.material.linewidth = 5;
    scene.add(arrow1);
}

function calcArc(xs,ys,xe,ye,start_hdg){
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
    
    if (radius == Number.POSITIVE_INFINITY || radius == Number.NEGATIVE_INFINITY) return [null,null];
    
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
    return [road_length,curvature];
}

function writeExtend(isarc){
    preview_geometries.delete();
    preview_geometries = new ModuleOpenDrive.vectorVectorDouble();
    let vd = new ModuleOpenDrive.vectorDouble();
    vd.push_back(isarc);
    if (sel_near_start){
        let std_vec = ModuleOpenDrive.get_start(OpenDriveMap,sel_road_id,-1);
        vd.push_back(std_vec.get(0));
        vd.push_back(std_vec.get(1));
        vd.push_back(fixHdg(std_vec.get(2)-Math.PI));
    }
    else{
        let std_vec = ModuleOpenDrive.get_end(OpenDriveMap,sel_road_id,-1);
        vd.push_back(std_vec.get(0));
        vd.push_back(std_vec.get(1));
        vd.push_back(fixHdg(std_vec.get(2)));
    }
    preview_geometries.push_back(vd);
}

function writeJuncExtend(isarc){
    preview_geometries.delete();
    preview_geometries = new ModuleOpenDrive.vectorVectorDouble();
    let vd = new ModuleOpenDrive.vectorDouble();
    vd.push_back(isarc);
    let std_vec = ModuleOpenDrive.get_end(OpenDriveMap,sel_road_id,sel_lane_id);
    vd.push_back(std_vec.get(0));
    vd.push_back(std_vec.get(1));
    vd.push_back(fixHdg(std_vec.get(2)));
    preview_geometries.push_back(vd);
}

function extendJuncExtend(isarc){
    let vd = new ModuleOpenDrive.vectorDouble();
    vd.push_back(isarc);
    let std_vec = ModuleOpenDrive.get_end(OpenDriveMap,"-1",-1);
    vd.push_back(std_vec.get(0));
    vd.push_back(std_vec.get(1));
    vd.push_back(fixHdg(std_vec.get(2)));
    preview_geometries.push_back(vd);
}

function writeStart(isarc){
    preview_geometries.delete();
    preview_geometries = new ModuleOpenDrive.vectorVectorDouble();
    let vd = new ModuleOpenDrive.vectorDouble();
    vd.push_back(isarc);
    vd.push_back(mouse_pos.x);
    vd.push_back(mouse_pos.y);
    preview_geometries.push_back(vd);
}

function writeHdg(hdg){
    let vd = preview_geometries.get(0);
    if (vd.size()==3){
        vd.push_back(hdg);
    }
    else{
        vd.set(3,hdg);
    }
    preview_geometries.set(0,vd);
}

function writeHdgLen(hdg,len){
    let vd = preview_geometries.get(0);
    if (vd.size()==3){
        vd.push_back(hdg);
        vd.push_back(len);
    }
    else{
        vd.set(3,hdg);
        vd.set(4,len);
    }
    preview_geometries.set(0,vd);
}

function writeLenCur(len,cur){
    let idx = preview_geometries.size()-1;
    let vd = preview_geometries.get(idx);
    if (vd.size()==4){
        vd.push_back(len);
        vd.push_back(cur);
    }
    else{
        vd.set(4,len);
        vd.set(5,cur);
    }
    preview_geometries.set(idx,vd);
}

function writeLen(len){
    let vd = preview_geometries.get(0);
    if (vd.size()==4){
        vd.push_back(len);
    }
    else{
        vd.set(4,len);
    }
    preview_geometries.set(0,vd);
}
function writeABC(abc){
    let vd = preview_geometries.get(0);
    vd.push_back(abc[2]);
    vd.push_back(abc[1]);
    vd.push_back(abc[0]);
    preview_geometries.set(0,vd);
}
function writeABCD(abcd){
    let vd = preview_geometries.get(0);
    vd.push_back(abcd[3]);
    vd.push_back(abcd[2]);
    vd.push_back(abcd[1]);
    vd.push_back(abcd[0]);
    preview_geometries.set(0,vd);
}

function previewCreateArc2(){
    console.log('previewCreateArc2');
    let idx = preview_geometries.size()-1;
    let last_geometry = preview_geometries.get(idx);
    let [len,cur] = calcArc(last_geometry.get(1),last_geometry.get(2),mouse_pos.x,mouse_pos.y,last_geometry.get(3));
    validPreview = len>0.2 && cur!=0;
    writeLenCur(len,cur);
}

function previewCreateLine(){
    let len = Math.hypot(preview_geometries.get(0).get(1)-mouse_pos.x, preview_geometries.get(0).get(2)-mouse_pos.y);
    let hdg = Math.atan2(mouse_pos.y-preview_geometries.get(0).get(2),mouse_pos.x-preview_geometries.get(0).get(1));
    validPreview = len>0.2;
    writeHdgLen(hdg,len);
}

function previewExtendLine(){
    let len = Math.hypot(preview_geometries.get(0).get(1)-mouse_pos.x, preview_geometries.get(0).get(2)-mouse_pos.y);
    validPreview = len>0.2;
    writeLen(len);
}

function previewRoadEnd(out_dir=true){
    let start_vec = ModuleOpenDrive.get_start(OpenDriveMap,hover_road_id,-1);
    let s_x = start_vec.get(0);
    let s_y = start_vec.get(1);
    let s_hdg = start_vec.get(2);
    let end_vec = ModuleOpenDrive.get_end(OpenDriveMap,hover_road_id,-1);
    let e_x = end_vec.get(0);
    let e_y = end_vec.get(1);
    let e_hdg = end_vec.get(2);

    let s_dist = Math.hypot(mouse_pos.x-s_x,mouse_pos.y-s_y);
    let e_dist = Math.hypot(mouse_pos.x-e_x,mouse_pos.y-e_y);

    hover_near_start = s_dist<e_dist;

    let from = new THREE.Vector3(e_x, e_y, 0);
    let direction = new THREE.Vector3(Math.cos(out_dir?e_hdg:e_hdg-Math.PI),Math.sin(out_dir?e_hdg:e_hdg-Math.PI),0);
    if (hover_near_start){
        from = new THREE.Vector3(s_x, s_y, 0);
        direction = new THREE.Vector3(Math.cos(out_dir?s_hdg-Math.PI:s_hdg),Math.sin(out_dir?s_hdg-Math.PI:s_hdg),0);
    }
    arrow1 = new THREE.ArrowHelper(direction.normalize(), from, 10, 0xff0000, 3, 3);
    arrow1.line.material.linewidth = 5;
    scene.add(arrow1);
}

function previewJuncStart(){
    let vec;
    if (hover_lane_id<0){
        vec = ModuleOpenDrive.get_end(OpenDriveMap,hover_road_id,hover_lane_id);
    }
    else{
        vec = ModuleOpenDrive.get_start(OpenDriveMap,hover_road_id,hover_lane_id);
    }
    let x = vec.get(0);
    let y = vec.get(1);
    let hdg = vec.get(2);

    let from = new THREE.Vector3(x, y, 0);
    let direction = new THREE.Vector3(Math.cos(hover_lane_id<0?hdg:hdg-Math.PI),Math.sin(hover_lane_id<0?hdg:hdg-Math.PI),0);
    arrow1 = new THREE.ArrowHelper(direction.normalize(), from, 10, 0xff0000, 3, 3);
    arrow1.line.material.linewidth = 5;
    scene.add(arrow1);
}

function previewJunctionExtend()
{
    let end_vec = ModuleOpenDrive.get_end(OpenDriveMap,hover_road_id,hover_lane_id);
    let e_x = end_vec.get(0);
    let e_y = end_vec.get(1);
    let e_hdg = end_vec.get(2);

    let from = new THREE.Vector3(e_x, e_y, 0);
    let direction = new THREE.Vector3(Math.cos(e_hdg),Math.sin(e_hdg),0);
    arrow1 = new THREE.ArrowHelper(direction.normalize(), from, 10, 0xff0000, 3, 3);
    arrow1.line.material.linewidth = 5;
    scene.add(arrow1);
}

function calcLink(g_x1,g_y1,g_hdg1,x2,y2,hdg2,clear=true){
    let g_len1,g_cur1,g_x2,g_y2,g_hdg2,g_len2,g_cur2;
    if (preview_geometries.size()>20){
        preview_geometries.delete();
        preview_geometries = new ModuleOpenDrive.vectorVectorDouble();
        validPreview = false;
        return;
    }
    if (clear){
        preview_geometries.delete();
        preview_geometries = new ModuleOpenDrive.vectorVectorDouble();
    }
    let vd1 = new ModuleOpenDrive.vectorDouble();
    let vd2 = new ModuleOpenDrive.vectorDouble();

    let m1 = Math.tan(g_hdg1);
    let b1 = g_y1-m1*g_x1;

    let m2 = Math.tan(hdg2);
    let b2 = g_y1-m2*g_x1;

    m1 = Math.round(m1 * 1000) / 1000
    b1 = Math.round(b1 * 1000) / 1000
    m2 = Math.round(m2 * 1000) / 1000
    b2 = Math.round(b2 * 1000) / 1000

    if (m1==m2 && b1==b2){
        //line only
        console.log("line only");
        g_len1 = Math.hypot(x2-g_x1, y2-g_y1);
        validPreview = g_len1>0.2;
        vd1.push_back(0);
        vd1.push_back(g_x1);
        vd1.push_back(g_y1);
        vd1.push_back(g_hdg1);
        vd1.push_back(g_len1);
        preview_geometries.push_back(vd1);
        return;
    }

    let intersection = getIntersection(g_x1,g_y1,g_hdg1,x2,y2,hdg2);
    console.log(intersection);
    if (intersection===null){

        // arc + combo
        console.log("arc + combo");

        g_x2 = (g_x1+x2)/2;
        g_y2 = (g_y1+y2)/2;
        
        [g_len1,g_cur1] = calcArc(g_x1,g_y1,g_x2,g_y2,g_hdg1);
        //get end of first arc
        let tmp_vec = ModuleOpenDrive.calc_end("arc",g_x1,g_y1,g_hdg1,g_len1,g_cur1);
        g_hdg2 = tmp_vec.get(2);

        validPreview = g_len1>0.2 && g_cur1!=0;
        if (!validPreview) return;

        vd1.push_back(1);
        vd1.push_back(g_x1);
        vd1.push_back(g_y1);
        vd1.push_back(g_hdg1);
        vd1.push_back(g_len1);
        vd1.push_back(g_cur1);
        preview_geometries.push_back(vd1);
        calcLink(g_x2,g_y2,g_hdg2,x2,y2,hdg2,false);
        return;
    }
    let [xi,yi] = intersection;

    let d1 = Math.hypot(xi-g_x1, yi-g_y1);
    let d2 = Math.hypot(xi-x2, yi-y2);

    d1 = Math.round(d1 * 1000) / 1000
    d2 = Math.round(d2 * 1000) / 1000

    if (d2<d1){
        //line + arc
        console.log("line + arc");

        g_len1 = d1-d2;
        let tmp_vec = ModuleOpenDrive.calc_end("line",g_x1,g_y1,g_hdg1,g_len1,0);
        g_x2 = tmp_vec.get(0);
        g_y2 = tmp_vec.get(1);
        g_hdg2 = tmp_vec.get(2);
        g_hdg2 = fixHdg(g_hdg2);

        let c = Math.hypot(g_x2-x2, g_y2-y2);
        let theta = hdg2-g_hdg1;
        theta = fixHdg(theta);
        let radius = (c/2)/Math.sin(theta/2);
        g_len2 = theta*radius;
        g_cur2 = 1/radius;
        validPreview = g_len1>0.2 && g_len2>0.2 && g_cur2!=0;

        vd1.push_back(0);
        vd1.push_back(g_x1);
        vd1.push_back(g_y1);
        vd1.push_back(g_hdg1);
        vd1.push_back(g_len1);
        vd2.push_back(1);
        vd2.push_back(g_x2);
        vd2.push_back(g_y2);
        vd2.push_back(g_hdg2);
        vd2.push_back(g_len2);
        vd2.push_back(g_cur2);
        preview_geometries.push_back(vd1);
        preview_geometries.push_back(vd2);
        return;
    }
    else if (d1<d2){
        //arc + line
        console.log("arc + line");

        g_hdg2 = hdg2;
        g_len2 = d2-d1;
        let tmp_vec = ModuleOpenDrive.calc_end("line",x2,y2,g_hdg2,g_len2,0);
        let tmp_x = tmp_vec.get(0);
        let tmp_y = tmp_vec.get(1);
        g_x2 = x2-(tmp_x-x2)
        g_y2 = y2-(tmp_y-y2)

        let c = Math.hypot(g_x2-g_x1,g_y2-g_y1);
        let theta = g_hdg2-g_hdg1;
        theta = fixHdg(theta);
        let radius = (c/2)/Math.sin(theta/2);
        g_len1 = theta*radius;
        g_cur1 = 1/radius;
        validPreview = g_len1>0.2 && g_len2>0.2 && g_cur1!=0;

        vd1.push_back(1);
        vd1.push_back(g_x1);
        vd1.push_back(g_y1);
        vd1.push_back(g_hdg1);
        vd1.push_back(g_len1);
        vd1.push_back(g_cur1);
        vd2.push_back(0);
        vd2.push_back(g_x2);
        vd2.push_back(g_y2);
        vd2.push_back(g_hdg2);
        vd2.push_back(g_len2);
        preview_geometries.push_back(vd1);
        preview_geometries.push_back(vd2);
        return;
    }
    else{
        //arc only
        console.log("arc only");
        let c = Math.hypot(x2-g_x1, y2-g_y1);
        let theta = hdg2-g_hdg1;
        theta = fixHdg(theta);
        let radius = (c/2)/Math.sin(theta/2);
        g_len1 = theta*radius;
        g_cur1 = 1/radius;
        validPreview = g_len1>0.2 && g_cur1!=0;
        vd1.push_back(1);
        vd1.push_back(g_x1);
        vd1.push_back(g_y1);
        vd1.push_back(g_hdg1);
        vd1.push_back(g_len1);
        vd1.push_back(g_cur1);
        preview_geometries.push_back(vd1);
        return;
    }
}

function previewRoadLink(){
    let g_x1,g_y1,g_hdg1;
    if (sel_near_start){
        let std_vec = ModuleOpenDrive.get_start(OpenDriveMap,sel_road_id,-1);
        g_x1 = std_vec.get(0);
        g_y1 = std_vec.get(1);
        g_hdg1 = std_vec.get(2);
        g_hdg1 = fixHdg(g_hdg1-Math.PI);
    }
    else{
        let std_vec = ModuleOpenDrive.get_end(OpenDriveMap,sel_road_id,-1);
        g_x1 = std_vec.get(0);
        g_y1 = std_vec.get(1);
        g_hdg1 = std_vec.get(2);
        g_hdg1 = fixHdg(g_hdg1);
    }

    let std_vec2,x2,y2,hdg2;
    if (hover_near_start){
        std_vec2 = ModuleOpenDrive.get_start(OpenDriveMap,hover_road_id,-1);
        x2 = std_vec2.get(0);
        y2 = std_vec2.get(1);
        hdg2 = std_vec2.get(2);
        hdg2 = fixHdg(hdg2);
    }
    else{
        std_vec2 = ModuleOpenDrive.get_end(OpenDriveMap,hover_road_id,-1);
        x2 = std_vec2.get(0);
        y2 = std_vec2.get(1);
        hdg2 = std_vec2.get(2);
        hdg2 = fixHdg(hdg2-Math.PI);
    }

    calcLink(g_x1,g_y1,g_hdg1,x2,y2,hdg2);
}

function fixHdg(hdg){
    if (hdg>Math.PI) return hdg-2*Math.PI;
    if (hdg<-Math.PI) return hdg+2*Math.PI;
    return hdg;
}

function previewJuncLink(){
    // console.log("previewJuncLink");
    let std_vec;
    if (junc_link_start_lid<0){
        std_vec = ModuleOpenDrive.get_end(OpenDriveMap,junc_link_start_rid,junc_link_start_lid);
    }
    else{
        std_vec = ModuleOpenDrive.get_start(OpenDriveMap,junc_link_start_rid,junc_link_start_lid);
    }
    g_x1 = std_vec.get(0);
    g_y1 = std_vec.get(1);
    g_hdg1 = std_vec.get(2);
    g_hdg1 = junc_link_start_lid<0?g_hdg1:g_hdg1-Math.PI;
    g_hdg1 = fixHdg(g_hdg1);

    let std_vec2;

    if (hover_lane_id<0){
        std_vec2 = ModuleOpenDrive.get_start(OpenDriveMap,hover_road_id,hover_lane_id);
    }
    else{
        std_vec2 = ModuleOpenDrive.get_end(OpenDriveMap,hover_road_id,hover_lane_id);
    }
    let x2 = std_vec2.get(0);
    let y2 = std_vec2.get(1);
    let hdg2 = std_vec2.get(2);
    hdg2 = hover_lane_id<0?hdg2:hdg2-Math.PI;
    hdg2 = fixHdg(hdg2);

    calcLink(g_x1,g_y1,g_hdg1,x2,y2,hdg2);
}

function previewJuncLink2(){
    console.log("previewJuncLink2");
    let std_vec;
    console.log("preview_geometries.size(): ",preview_geometries.size());

    if (preview_geometries.size()==1){
        std_vec = ModuleOpenDrive.get_end(OpenDriveMap,sel_road_id,sel_lane_id);
        g_x1 = std_vec.get(0);
        g_y1 = std_vec.get(1);
        g_hdg1 = std_vec.get(2);
    }
    else{
        let last_geometry = preview_geometries.get(preview_geometries.size()-1);
        g_x1 = last_geometry.get(1);
        g_y1 = last_geometry.get(2);
        g_hdg1 = last_geometry.get(3);
    }
    
    g_hdg1 = fixHdg(g_hdg1);

    let std_vec2;

    if (hover_lane_id<0){
        std_vec2 = ModuleOpenDrive.get_start(OpenDriveMap,hover_road_id,hover_lane_id);
    }
    else{
        std_vec2 = ModuleOpenDrive.get_end(OpenDriveMap,hover_road_id,hover_lane_id);
    }
    let x2 = std_vec2.get(0);
    let y2 = std_vec2.get(1);
    let hdg2 = std_vec2.get(2);
    hdg2 = hover_lane_id<0?hdg2:hdg2-Math.PI;
    hdg2 = fixHdg(hdg2);
    calcLink(g_x1,g_y1,g_hdg1,x2,y2,hdg2,false);
}

function calcMouseWorldPos(event){
    mouse_vec.set(
        ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
    mouse_vec.unproject( camera );
    mouse_vec.sub( camera.position ).normalize();
    mouse_pos.copy( camera.position ).add( mouse_vec.multiplyScalar( -camera.position.z / mouse_vec.z ) );
}

function drawPreviewMesh(){
    scene.remove(preview_reflines);
    const reflines_geom = new THREE.BufferGeometry();
    const odr_refline_segments = ModuleOpenDrive.create_preview_reflines(parseFloat(PARAMS.resolution));
    reflines_geom.setAttribute('position', new THREE.Float32BufferAttribute(getStdVecEntries(odr_refline_segments.vertices).flat(), 3));
    reflines_geom.setIndex(getStdVecEntries(odr_refline_segments.indices, true));
    preview_reflines = new THREE.LineSegments(reflines_geom, refline_material);
    preview_reflines.renderOrder = 10;
    preview_reflines.visible = PARAMS.ref_line;
    preview_reflines.matrixAutoUpdate = false;
    disposable_objs.push(reflines_geom);
    scene.add(preview_reflines);

    scene.remove(preview_mesh);
    const odr_road_network_mesh = ModuleOpenDrive.create_preview_mesh(parseFloat(PARAMS.resolution));
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

    preview_mesh = new THREE.Mesh(road_network_geom_new, road_network_material);
    
    preview_mesh.renderOrder = 0;
    preview_mesh.userData = { odr_road_network_mesh };
    preview_mesh.matrixAutoUpdate = false;
    preview_mesh.visible = !(PARAMS.view_mode == 'Outlines');
    scene.add(preview_mesh);
    
    scene.remove(preview_lanelines);
    const lane_outlines_geom = new THREE.BufferGeometry();
    lane_outlines_geom.setAttribute('position', road_network_geom_new.attributes.position);
    lane_outlines_geom.setIndex(getStdVecEntries(odr_lanes_mesh_new.get_lane_outline_indices(), true));
    preview_lanelines = new THREE.LineSegments(lane_outlines_geom, lane_outlines_material);
    preview_lanelines.renderOrder = 9;
    disposable_objs.push(lane_outlines_geom);
    scene.add(preview_lanelines);

    odr_lanes_mesh_new.delete();
}

function drawHandleMesh(){
    scene.remove(handle_reflines);
    const reflines_geom = new THREE.BufferGeometry();
    const odr_refline_segments = ModuleOpenDrive.create_handle_reflines(OpenDriveMap, parseFloat(PARAMS.resolution),sel_road_id);
    reflines_geom.setAttribute('position', new THREE.Float32BufferAttribute(getStdVecEntries(odr_refline_segments.vertices).flat(), 3));
    reflines_geom.setIndex(getStdVecEntries(odr_refline_segments.indices, true));
    handle_reflines = new THREE.LineSegments(reflines_geom, refline_material);
    handle_reflines.renderOrder = 10;
    handle_reflines.visible = PARAMS.ref_line;
    handle_reflines.matrixAutoUpdate = false;
    disposable_objs.push(reflines_geom);
    scene.add(handle_reflines);

    scene.remove(handle_mesh);
    const odr_road_network_mesh = ModuleOpenDrive.create_handle_mesh(OpenDriveMap, parseFloat(PARAMS.resolution),sel_road_id);
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

    handle_mesh = new THREE.Mesh(road_network_geom_new, road_network_material);
    
    handle_mesh.renderOrder = 0;
    handle_mesh.userData = { odr_road_network_mesh };
    handle_mesh.matrixAutoUpdate = false;
    handle_mesh.visible = !(PARAMS.view_mode == 'Outlines');
    scene.add(handle_mesh);
    
    scene.remove(handle_lanelines);
    const lane_outlines_geom = new THREE.BufferGeometry();
    lane_outlines_geom.setAttribute('position', road_network_geom_new.attributes.position);
    lane_outlines_geom.setIndex(getStdVecEntries(odr_lanes_mesh_new.get_lane_outline_indices(), true));
    handle_lanelines = new THREE.LineSegments(lane_outlines_geom, lane_outlines_material);
    handle_lanelines.renderOrder = 9;
    disposable_objs.push(lane_outlines_geom);
    scene.add(handle_lanelines);

    odr_lanes_mesh_new.delete();
}

function init_dat_gui(){
    junc_gui = new dat.GUI();
    junc_gui.domElement.classList.add('junc_controls');
    junc_gui.domElement.getElementsByClassName('close-button')[0].remove();
    junc_gui.domElement.style.display = 'none';

    road_gui = new dat.GUI();
    road_gui.domElement.classList.add('road_controls');
    road_gui.domElement.getElementsByClassName('close-button')[0].remove();
    road_gui.domElement.style.display = 'none';
    roadCs["ID"] = road_gui.add({"ID":"-1"}, 'ID');
    roadCs["ID"].domElement.classList.add('string_c');
    roadCs["ID"].domElement.getElementsByTagName('input')[0].classList.add("string_input");

    for (let i=0;i<4;i++){
        let button = document.createElement("div");
        button.classList.add("button");
        button.classList.add("lane_button");
        button.innerHTML = i==0||i==3?"+":"-";
        roadCs["ID"].domElement.append(button);
        button.onclick = function(e){
            e.stopPropagation();
            let idx = Array.from(this.parentNode.children).indexOf(this)-1;
            if (idx==0){
                lane_datas[(getMinLane()-1).toString()] = [0,0,0,3.5,0,0,0];
            }
            else if (idx==1){
                delete lane_datas[getMinLane().toString()];
            }
            else if (idx==2){
                console.log("delete max lane",getMaxLane());
                delete lane_datas[getMaxLane().toString()];
                console.log(lane_datas);
            }
            else if (idx==3){
                lane_datas[(getMaxLane()+1).toString()] = [0,0,0,3.5,0,0,0];
            }
            ModuleOpenDrive.write_handle_road_xml(OpenDriveMap, sel_road_id, dictToStdMapIntVecDouble(lane_datas), arrToStdVecDouble(lane_offset));
            writeXMLFile();
        };
    }

    let road_predecessorF = road_gui.addFolder('Predecessor');
    road_predecessorF.open();
    let pred_dict = {"type":"road","id":"-1"};
    roadCs["pred_type"] = road_predecessorF.add(pred_dict,"type").onChange(updateHandleRoad);
    roadCs["pred_type"].domElement.classList.add('string_c');
    roadCs["pred_type"].domElement.getElementsByTagName('input')[0].classList.add("string_input");
    roadCs["pred_type"].domElement.getElementsByTagName('input')[0].onclick = function(e){
        let val = this.value!="road"?"road":"junction";
        this.value = val;
        roadCs["pred_type"].setValue(val);
        this.blur();
    };
    roadCs["pred_id"] = road_predecessorF.add(pred_dict,"id").onChange(updateHandleRoad);
    roadCs["pred_id"].domElement.classList.add('string_c');
    roadCs["pred_id"].domElement.getElementsByTagName('input')[0].classList.add("string_input");
    roadCs["pred_id"].domElement.getElementsByTagName('input')[0].onclick = function(e){
        setMode(LINK_ROAD_PRED);
        this.blur();
    };
    road_predLaneLinksF = road_predecessorF.addFolder('lanelinks');
    road_predLaneLinksF.open();
    let road_successorF = road_gui.addFolder('Successor');
    road_successorF.open();
    let succ_dict = {"type":"road","id":"-1"};
    roadCs["succ_type"] = road_successorF.add(succ_dict,"type").onChange(updateHandleRoad);
    roadCs["succ_type"].domElement.classList.add('string_c');
    roadCs["succ_type"].domElement.getElementsByTagName('input')[0].classList.add("string_input");
    roadCs["succ_type"].domElement.getElementsByTagName('input')[0].onclick = function(e){
        let val = this.value!="road"?"road":"junction";
        this.value = val;
        roadCs["succ_type"].setValue(val);
        this.blur();
    };
    roadCs["succ_id"] = road_successorF.add(succ_dict,"id").onChange(updateHandleRoad);
    roadCs["succ_id"].domElement.classList.add('string_c');
    roadCs["succ_id"].domElement.getElementsByTagName('input')[0].classList.add("string_input");
    roadCs["succ_id"].domElement.getElementsByTagName('input')[0].onclick = function(e){
        setMode(LINK_ROAD_SUCC);
        this.blur();
    };
    road_succLaneLinksF = road_successorF.addFolder('lanelinks');
    road_succLaneLinksF.open();

    roadCs["pred_lanelinks"] = [];
    roadCs["succ_lanelinks"] = [];
}

function load_vector_data(){
    // Load vector lines
    fetch("KCITY/KCITY_LINES.bin")
    .then(response => response.arrayBuffer())
    .then(buffer => {
        const view = new Float32Array(buffer);
        
        map_offset_x = view[0];
        map_offset_y = view[1];
        let offset_idx = 2;
        for (let i=0;i<view.length/5;i++){
            let type = view[i*5+0+offset_idx];
            let id = view[i*5+1+offset_idx];
            let x = view[i*5+2+offset_idx];
            let y = view[i*5+3+offset_idx];
            let z = view[i*5+4+offset_idx];

            if (id in lines_dict){
                lines_dict[id]['points'].push(new THREE.Vector3( x-map_offset_x, y-map_offset_y, 0 ));
            }
            else{
                lines_dict[id] = {};
                lines_dict[id]['points'] = [new THREE.Vector3( x-map_offset_x, y-map_offset_y, 0 )];
                lines_dict[id]['type'] = type;
            }
        }
        
        for (const [key, value] of Object.entries(lines_dict)) {
            const geometry = new THREE.BufferGeometry().setFromPoints( value['points'] );
            let line_m = new THREE.LineBasicMaterial({
                linewidth: 1,
            });
            let point_m = new THREE.PointsMaterial({
                size: 0.2,
            });
            // let randomColor = Math.floor(0xff0000 + Math.random() * 0x00ffff);
            // let randomLineMaterial = new THREE.LineBasicMaterial({
            //     color: randomColor,
            //     linewidth: 1,
            // });
            // let randomPointsMaterial = new THREE.PointsMaterial({
            //     color: randomColor,
            //     size: 0.2,
            // });
            if (value['type'] < 200){
                line_m.setValues({"color" : 0xffff00});
                point_m.setValues({"color" : 0xffff00});
            }
            else if (value['type'] < 300){
                line_m.setValues({"color" : 0xffffff});
                point_m.setValues({"color" : 0xffffff});
            }
            else if (value['type'] < 400){
                line_m.setValues({"color" : 0x0000ff});
                point_m.setValues({"color" : 0x0000ff});
            }
            let line = new THREE.Line( geometry, line_m );
            let points = new THREE.Points( geometry, point_m );
            line.matrixAutoUpdate = false;
            points.matrixAutoUpdate = false;
            scene.add( line );
            scene.add( points );
            
            // for moving to lines when xodr file is empty..
            // if (key==1){
            //     const bbox = new THREE.Box3().setFromObject(line);
            //     fitViewToBbox(bbox);
            // }
        }
    });
}

function load_image(){
    // Load screenshot of map
    let texture_loader = new THREE.TextureLoader();
    texture_loader.load('map_screenshots/katech_satellite.png', function ( image_texture ) {
        let image_material = new THREE.MeshLambertMaterial({
            map: image_texture
        });
        image_material.transparent = true;
        image_material.opacity = 0.5;
        
        let scale = 0.1250;
        let w = image_texture.image.width * scale;
        let h = image_texture.image.height * scale;
        let dx = 312;
        let dy = -153.5;
        let image_geometry = new THREE.PlaneGeometry(w, h); // width height
        let image_mesh = new THREE.Mesh(image_geometry, image_material);
        image_mesh.position.set(dx,dy,-0.0000001);
        scene.add(image_mesh);
    });

    // texture_loader.load('map_screenshots/katech_small.png', function ( image_texture ) {
    //     let image_material = new THREE.MeshLambertMaterial({
    //         map: image_texture
    //     });
    //     image_material.transparent = true;
    //     image_material.opacity = 0.5;
        
    //     let scale = 0.625;
    //     let w = image_texture.image.width * scale;
    //     let h = image_texture.image.height * scale;
    //     let dx = 380;
    //     let dy = -194;
    //     let image_geometry = new THREE.PlaneGeometry(w, h); // width height
    //     let image_mesh = new THREE.Mesh(image_geometry, image_material);
    //     image_mesh.position.set(dx,dy,-0.1);
    //     scene.add(image_mesh);
    // });

    // texture_loader.load('map_screenshots/katech2.png', function ( image_texture ) {
    //     image_texture.rotation = -0.018;
    //     let image_material = new THREE.MeshLambertMaterial({
    //         map: image_texture
    //     });
    //     image_material.transparent = true;
    //     image_material.opacity = 0.5;
        
    //     let scale = 0.095;
    //     let w = image_texture.image.width * scale;
    //     let h = image_texture.image.height * scale;
    //     let dx = 7335 * scale;
    //     let dy = -3645 * scale;
    //     let image_geometry = new THREE.PlaneGeometry(w, h); // width height
    //     let image_mesh = new THREE.Mesh(image_geometry, image_material);
    //     image_mesh.position.set(dx,dy,-0.1);
    //     scene.add(image_mesh);
    // });
}

function line2axy(line){
    let data = line.split(',');
    let azi = parseFloat(data[1])*Math.PI/180;
    let lat = parseFloat(data[2]);
    let lon = parseFloat(data[3]);
    let [x,y] = proj4(PROJ_STR,[lon,lat]);
    
    return [azi,x-REF_X,y-REF_Y];
}

function load_gps(){

    fetch('gps_data/221017-PG1.txt')
    .then(response => response.text())
    .then(function(text){
        let lines = text.split('\r\n');
        for (let i=0;i<lines.length;i+=10){
            let [azi,x,y] = line2axy(lines[i]);
            let from = new THREE.Vector3(x, y, 0);
            let direction = new THREE.Vector3(Math.cos(azi),Math.sin(azi), 0);
            let arrow = new THREE.ArrowHelper(direction.normalize(), from, 1, 0x00ffff, 1, 1);
            arrow.line.material.linewidth = 5;
            scene.add(arrow);
        }
    });


    fetch('gps_data/GPS_CALIBRATION.txt')
    .then(response => response.text())
    .then(function(text){
        const vertices = [];
        let lines = text.split('\r\n');
        console.log(lines.length);
        for (let i=0;i<lines.length;i++){
            let [azi,x,y] = line2axy(lines[i]);
            vertices.push( x, y, 0 );
            console.log(x,y);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        const material = new THREE.PointsMaterial( { color: 0xff0000 } );
        const points = new THREE.Points( geometry, material );
        scene.add( points );
            
    });
}



function afterModuleLoad(){
    getMapList();
    init_dat_gui();
    setMode(DEFAULT);
    load_vector_data();
    load_image();
    load_gps();
    preview_geometries = new ModuleOpenDrive.vectorVectorDouble();
}

function selectLine(){
    scene.remove(selected_line);
    scene.remove(selected_points);
    
    for (const [key, value] of Object.entries(lines_dict)) {
        for (const point of value['points']){
            if (mouse_pos.distanceTo(point)<0.5){

                preview_geometries.delete();
                preview_geometries = new ModuleOpenDrive.vectorVectorDouble();
                for (let i=0;i<value['points'].length-1;i++){
                    let cur_point,nxt_point;
                    if (flip){
                        cur_point = value['points'][value['points'].length-1-i];
                        nxt_point = value['points'][value['points'].length-1-i-1];
                    }
                    else{
                        cur_point = value['points'][i];
                        nxt_point = value['points'][i+1];
                    }
                    let cx = cur_point.x;
                    let cy = cur_point.y;
                    let nx = nxt_point.x;
                    let ny = nxt_point.y;
                    let hdg = Math.atan2(ny-cy,nx-cx);
                    let length = ((ny-cy)**2+(nx-cx)**2)**0.5;
                    let vd = new ModuleOpenDrive.vectorDouble();
                    vd.push_back(0);
                    vd.push_back(cx);
                    vd.push_back(cy);
                    vd.push_back(hdg);
                    vd.push_back(length);
                    preview_geometries.push_back(vd);
                }
                validPreview = true;

                scene.remove(selected_line);
                scene.remove(selected_points);
                const geometry = new THREE.BufferGeometry().setFromPoints( value['points'] );
                let selectedLineMaterial = new THREE.LineBasicMaterial({
                    color: 0xff0000,
                    linewidth: 5,
                });
                let selectedPointsMaterial = new THREE.PointsMaterial({
                    color: 0xff0000,
                    size: 0.3,
                });
                selected_line = new THREE.Line( geometry, selectedLineMaterial );
                selected_points = new THREE.Points( geometry, selectedPointsMaterial );
                selected_line.matrixAutoUpdate = false;
                selected_points.matrixAutoUpdate = false;
                selected_line.renderOrder = 20;
                selected_points.renderOrder = 20;
                scene.add( selected_line );
                scene.add( selected_points );
                selected_line_id = key;
                return;
            }
        }
    }
    selected_line_id = -1;
}

function get_intersect(m_1,b_1,m_2,b_2){
    let a1 = m_1;
    let a2 = m_2;
    let b1 = -1;
    let b2 = -1;
    let c1 = b_1;
    let c2 = b_2;
    let xi = (b1*c2-b2*c1)/(a1*b2-a2*b1);
    let yi = (c1*a2-c2*a1)/(a1*b2-a2*b1);
    return [xi,yi];
}

function drawLinks(){
    for (let arrow of link_arrows){
        scene.remove(arrow);
    }
    let std_vec = ModuleOpenDrive.get_road_arrows(OpenDriveMap);
    link_arrows = [];
    for(let i=0;i<std_vec.size();i++){
        let type = std_vec.get(i).get(0);
        let color;
        if (type == 0)
            color = 0xff0000;
        else if (type == 1)
            color = 0x00ffff;
        else if (type == 2)
            color = 0xffff00;
        else if (type == 3)
            color = 0x00ff00;
        else if (type == 4)
            color = 0xff8800;
        let from = new THREE.Vector3(std_vec.get(i).get(1), std_vec.get(i).get(2), 0);
        let to = new THREE.Vector3(std_vec.get(i).get(3), std_vec.get(i).get(4), 0);
        let direction = to.clone().sub(from);
        let length = direction.length();
        let arrow = new THREE.ArrowHelper(direction.normalize(), from, length, color, 1, 1);
        arrow.line.material.linewidth = 5;
        scene.add(arrow);
        link_arrows.push(arrow);
    }
}

function drawJunctionBBoxes(){
    for (let line of junc_lines){
        scene.remove(line);
    }
    junc_lines = [];
    let std_vec = ModuleOpenDrive.get_junction_bboxes(OpenDriveMap);
    for(let i=0;i<std_vec.size();i++){
        let junc_id = std_vec.get(i).get(0);
        let minx = std_vec.get(i).get(1);
        let miny = std_vec.get(i).get(2);
        let maxx = std_vec.get(i).get(3);
        let maxy = std_vec.get(i).get(4);
        // console.log(minx,miny,maxx,maxy);
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff
        });
        
        const points = [];
        points.push( new THREE.Vector3( minx, miny, 0.01 ) );
        points.push( new THREE.Vector3( minx, maxy, 0.01 ) );
        points.push( new THREE.Vector3( maxx, maxy, 0.01 ) );
        points.push( new THREE.Vector3( maxx, miny, 0.01 ) );
        points.push( new THREE.Vector3( minx, miny, 0.01 ) );
        
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        let line = new THREE.Line( geometry, material );
        scene.add( line );
        junc_lines.push( line );
    }
}

function afterMapLoad(){

    ModuleOpenDrive.create_preview_road(OpenDriveMap);

    drawLinks();

    drawJunctionBBoxes();

    let junctions = ModuleOpenDrive.get_junction_ids(OpenDriveMap);
    let junctions_dict = {};
    for(let i=0;i<junctions.size();i++){
        junctions_dict[junctions.get(i)] = junctions.get(i);
    }
    
    if (junc_idC !== null){
        junc_idC.remove();
    }
    junc_idC = junc_gui.add(JUNCTION_DATA, 'junction_id', junctions_dict).onChange(()=>{updateCurJunction()});
    if (junctions.size()>0)
        junc_idC.setValue(junctions.get(0));
}

function getMapList(){
    fetch('http://localhost:8000/getMapList', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: "",
    }).then((response)=>{
        return response.text();
    }).then(function(data) {
        files_gui = new dat.GUI();
        files_gui.domElement.classList.add('files_controls');
        files_gui.domElement.getElementsByClassName('close-button')[0].remove();
        let files_dict = JSON.parse(data);
        let first = true;
        let folderC = files_gui.addFolder("folder");
        let html_string = "";
        for (const [folder, files] of Object.entries(files_dict)) {
            for (const file of files){
                let filepath = 'maps'+'/'+folder+'/'+file;
                if (!filepath in fetched_dict){
                    fetched_dict[filepath] = false;
                }
            }

            for (const file of files){
                if (first){
                    first = false;
                    map_filename = file;
                    map_folder = folder;
                    map_filepath = 'maps'+'/'+map_folder+'/'+map_filename;
                    html_string+="<div onclick='onFileLeftClick(this)' oncontextmenu='onFileRightClick(this);return false;' class='file selected'>"+file+"</div>";
                }
                else{
                    html_string+="<div onclick='onFileLeftClick(this)' oncontextmenu='onFileRightClick(this);return false;' class='file'>"+file+"</div>";
                }
            }
        }
        folderC.domElement.innerHTML = html_string;
        // console.log(map_filepath,map_filename);
        fetch_map();
    });
}

function onFileLeftClick(dom){
    map_filename = dom.innerHTML;
    map_folder = map_filename.split('.')[0].split('_')[0];
    map_filepath = 'maps'+'/'+map_folder+'/'+map_filename;
    // console.log(map_filename,map_filepath);
    for (file of document.getElementsByClassName("file")){
        file.classList.remove('selected');
    }
    dom.classList.add('selected');
    setMode(DEFAULT);
    fetch_map();
}

function onFileRightClick(dom){
    map_filename = dom.innerHTML;
    map_folder = map_filename.split('.')[0].split('_')[0];
    map_filepath = 'maps'+'/'+map_folder+'/'+map_filename;
    let body_dict = {};
    body_dict['filepath'] = map_filepath;
    fetch('http://localhost:8000/delete', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body_dict),
    }).then(()=>{
        getMapList();
    });
}

function writeXMLFile(new_file=false){
    let body_dict = {};
    body_dict['filepath'] = map_filepath;
    body_dict['data'] = ModuleOpenDrive.save_map(OpenDriveMap);
    fetch('http://localhost:8000/save', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body_dict),
    }).then(()=>{
        if (new_file){
            getMapList();
        }
        else{
            fetch_map();
        }
    });
}

function updateCurJunction(){
    console.log("updateCurJunction");
}

function updateCurRoad(){
    console.log("updateCurRoad");
}


function getTimestring(){
    let date = new Date();
    let year = date.getFullYear();
    let month = ('0'+(date.getMonth()+1)).slice(-2);
    let day = ('0'+date.getDate()).slice(-2);
    let hour = ('0'+date.getHours()).slice(-2);
    let min = ('0'+date.getMinutes()).slice(-2);
    let sec = ('0'+date.getSeconds()).slice(-2);
    let timestring = year+month+day+'_'+hour+min+sec;
    return timestring;
}

function getMinLane(){
    let minLane = 0;
    for (const key of Object.keys(lane_datas)) {
        minLane = Math.min(parseInt(key),minLane);
    }
    return minLane;
}

function getMaxLane(){
    let maxLane = 0;
    for (const key of Object.keys(lane_datas)) {
        maxLane = Math.max(parseInt(key),maxLane);
    }
    return maxLane;
}

function getLaneWidths(){
    lane_datas = stdMapIntVecDoubleToDict(ModuleOpenDrive.get_lane_datas(OpenDriveMap,sel_road_id));
    for (const folder of road_laneFs){
        road_gui.removeFolder(folder);
    }
    road_laneFs = [];
    for(let lane_id = getMinLane();lane_id<=getMaxLane();lane_id++){
        if (lane_id==0) continue;
        let laneFolder = road_gui.addFolder('Lane '+lane_id.toString());
        laneFolder.open();
        road_laneFs.push(laneFolder);
        let lane_data = lane_datas[lane_id];
        let lane_data_dict = {};
        for (let i = 0; i*5<lane_data.length-2; i++){
            lane_data_dict[i.toString()+'_s'] = lane_data[2+i*5+0];
            lane_data_dict[i.toString()+'_a'] = lane_data[2+i*5+1];
            lane_data_dict[i.toString()+'_b'] = lane_data[2+i*5+2];
            lane_data_dict[i.toString()+'_c'] = lane_data[2+i*5+3];
            lane_data_dict[i.toString()+'_d'] = lane_data[2+i*5+4];
        }
        for (const [key, value] of Object.entries(lane_data_dict)) {
            if (key.endsWith('_c') || key.endsWith('_d')) continue;
            let tempC = laneFolder.add(lane_data_dict, key);
            tempC.name = lane_id.toString()+"_"+key;
            tempC.setValue(value);
            tempC.step(key.endsWith('_b')?0.001:0.01);
            tempC.onChange(function(e){
                let [lane_id,idx,param] = this.name.split("_");
                lane_datas[lane_id][2+parseInt(idx)*5+'sabcd'.indexOf(param)] = e;
                updateHandleRoad();
            });
            road_laneCs.push(tempC);
        }
        let button = document.createElement("div");
        button.classList.add("button");
        button.innerHTML = "+";
        button.onclick = function(e){
            e.stopPropagation();
            let str = this.parentElement.textContent.split(' ')[1];
            let lane_id = parseInt(str.substr(0,str.length-1));
            let new_idx = (lane_datas[lane_id].length-2)/5;
            lane_datas[lane_id].push(lane_datas[lane_id][2+(new_idx-1)*5+0]+1);
            lane_datas[lane_id].push(lane_datas[lane_id][2+(new_idx-1)*5+1]);
            lane_datas[lane_id].push(lane_datas[lane_id][2+(new_idx-1)*5+2]);
            lane_datas[lane_id].push(lane_datas[lane_id][2+(new_idx-1)*5+3]);
            lane_datas[lane_id].push(lane_datas[lane_id][2+(new_idx-1)*5+4]);
            updateHandleRoad();
        };
        laneFolder.domElement.getElementsByClassName("title")[0].append(button);
        let lis = laneFolder.domElement.getElementsByTagName("li");
        for (let i=0;i<(lis.length-4)/3;i++){
            let button = document.createElement("div");
            button.classList.add("button");
            button.innerHTML = "-";
            button.onclick = function(e){
                e.stopPropagation();
                let str = this.parentElement.getElementsByClassName("title")[0].textContent.split(' ')[1];
                let lane_id = parseInt(str.substr(0,str.length-1));
                let idx = (Array.from(this.parentNode.children).indexOf(this)-3)/4;
                lane_datas[lane_id].splice(2+idx*5,5);
                updateHandleRoad();
            };
            lis[6+3*i].after(button);
        }
    }
}

function getLaneOffset(){
    lane_offset = getStdVecEntries(ModuleOpenDrive.get_lane_offset(OpenDriveMap,sel_road_id),true);
    if (road_laneOffsetF!==null)
        road_gui.removeFolder(road_laneOffsetF);
    road_laneOffsetF = road_gui.addFolder('LaneOffset');
    road_laneOffsetF.open();
    let lane_offset_dict = {};
    for (let i = 0; i*5<lane_offset.length; i++){
        lane_offset_dict[i.toString()+'_s'] = lane_offset[i*5+0];
        lane_offset_dict[i.toString()+'_a'] = lane_offset[i*5+1];
        lane_offset_dict[i.toString()+'_b'] = lane_offset[i*5+2];
        lane_offset_dict[i.toString()+'_c'] = lane_offset[i*5+3];
        lane_offset_dict[i.toString()+'_d'] = lane_offset[i*5+4];
    }

    for (const [key, value] of Object.entries(lane_offset_dict)) {
        if (key.endsWith('_c') || key.endsWith('_d')) continue;
        let tempC = road_laneOffsetF.add(lane_offset_dict, key);
        tempC.name = key;
        tempC.setValue(value);
        tempC.step(key.endsWith('_b')?0.001:0.01);
        tempC.onChange(function(e){
            let [idx,param] = this.name.split("_");
            lane_offset[parseInt(idx)*5+'sabcd'.indexOf(param)] = e;
            updateHandleRoad();
        });
        road_laneOffsetCs.push(tempC);
    }
    let button = document.createElement("div");
    button.classList.add("button");
    button.innerHTML = "+";
    button.onclick = function(e){
        e.stopPropagation();
        let new_idx = lane_offset.length/5;
        lane_offset.push(lane_offset[(new_idx-1)*5+0]+1);
        lane_offset.push(lane_offset[(new_idx-1)*5+1]);
        lane_offset.push(lane_offset[(new_idx-1)*5+2]);
        lane_offset.push(lane_offset[(new_idx-1)*5+3]);
        lane_offset.push(lane_offset[(new_idx-1)*5+4]);
        updateHandleRoad();
    };
    road_laneOffsetF.domElement.getElementsByClassName("title")[0].append(button);
    let lis = road_laneOffsetF.domElement.getElementsByTagName("li");
    for (let i=0;i<(lis.length-4)/3;i++){
        let button = document.createElement("div");
        button.classList.add("button");
        button.innerHTML = "-";
        button.onclick = function(e){
            e.stopPropagation();
            let idx = (Array.from(this.parentNode.children).indexOf(this)-3)/4;
            lane_offset.splice(idx*5,5);
            updateHandleRoad();
        };
        lis[6+3*i].after(button);
    }
}

function collect_road_data(){
    let arr = [];
    arr.push(['none','road','junction'].indexOf(roadCs["pred_type"].getValue()));
    arr.push(parseInt(roadCs["pred_id"].getValue()));
    arr.push(['none','road','junction'].indexOf(roadCs["succ_type"].getValue()));
    arr.push(parseInt(roadCs["succ_id"].getValue()));
    return arrToStdVecInt(arr);
}

function getRoadInfo(){
    console.log("getRoadInfo");
    console.log("sel_road_id",sel_road_id);
    roadCs["ID"].setValue(sel_road_id);

    let road_data_arr = getStdVecEntries(ModuleOpenDrive.get_road_data(OpenDriveMap,sel_road_id),true);
    roadCs["pred_type"].onChange(()=>{});
    roadCs["pred_id"].onChange(()=>{});
    roadCs["succ_type"].onChange(()=>{});
    roadCs["succ_id"].onChange(()=>{});
    roadCs["pred_type"].setValue(['none','road','junction'][road_data_arr[0]]);
    roadCs["pred_id"].setValue(road_data_arr[1]);
    roadCs["succ_type"].setValue(['none','road','junction'][road_data_arr[2]]);
    roadCs["succ_id"].setValue(road_data_arr[3]);
    roadCs["pred_type"].onChange(updateHandleRoad);
    roadCs["pred_id"].onChange(updateHandleRoad);
    roadCs["succ_type"].onChange(updateHandleRoad);
    roadCs["succ_id"].onChange(updateHandleRoad);

    for (let controller of roadCs["pred_lanelinks"]){
        controller.remove();
    }
    roadCs["pred_lanelinks"] = [];
    if (roadCs["pred_type"].getValue()==="road"){
        road_predLaneLinksF.show();
        let arr = getStdVecEntries(ModuleOpenDrive.get_road_pred(OpenDriveMap,sel_road_id),true);
        for (let i=0;i*2<arr.length;i++){
            let lane_id = arr[i*2+0].toString();
            if (lane_id === "0") continue;
            let pred = arr[i*2+1];
            let temp_dict = {};
            temp_dict[lane_id]=pred;
            let temp_C = road_predLaneLinksF.add(temp_dict,lane_id);
            temp_C.name = lane_id.toString();
            temp_C.step(1);
            temp_C.onChange(function(e){
                let lane_id = this.name;
                lane_datas[lane_id][0] = e;
                updateHandleRoad();
            });
            roadCs["pred_lanelinks"].push(temp_C);
        }
    }
    else{
        road_predLaneLinksF.hide();
    }

    for (let controller of roadCs["succ_lanelinks"]){
        controller.remove();
    }
    roadCs["succ_lanelinks"] = [];
    if (roadCs["succ_type"].getValue()==="road"){
        road_succLaneLinksF.show();
        let arr = getStdVecEntries(ModuleOpenDrive.get_road_succ(OpenDriveMap,sel_road_id),true);
        for (let i=0;i*2<arr.length;i++){
            let lane_id = arr[i*2+0].toString();
            if (lane_id === "0") continue;
            let succ = arr[i*2+1];
            let temp_dict = {};
            temp_dict[lane_id]=succ;
            let temp_C = road_succLaneLinksF.add(temp_dict,lane_id);
            temp_C.name = lane_id.toString();
            temp_C.step(1);
            temp_C.onChange(function(e){
                let lane_id = this.name;
                lane_datas[lane_id][1] = e;
                updateHandleRoad();
            });
            roadCs["succ_lanelinks"].push(temp_C);
        }
    }
    else{
        road_succLaneLinksF.hide();
    }
    
}

function resetLaneWidths(){
    lane_datas = {"-1":[0,0,0,3.5,0,0,0], "0":[0,0,0,3.5,0,0,0]};
}

function updateHandleRoad(){
    ModuleOpenDrive.update_handle_road(OpenDriveMap, sel_road_id, collect_road_data(), dictToStdMapIntVecDouble(lane_datas), arrToStdVecDouble(lane_offset));
    selectRoad();
}

function selectRoad(){
    drawHandleMesh();
    getLaneOffset();
    getLaneWidths();
    getRoadInfo();
}