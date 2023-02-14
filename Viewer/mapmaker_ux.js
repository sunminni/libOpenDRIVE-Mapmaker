
function showJuncControls(bool){
    if (bool){
        junc_gui.domElement.style.display = 'block';
    }
    else{
        junc_gui.domElement.style.display = 'none';
    }
}

function showPreview(){
    scene.remove(arrow1);
    scene.remove(preview_mesh);
    validPreview = false;
    let start_lane = g_start_lane;
    let end_lane = g_end_lane;
    if (MapmakerMode === CONNECT){
        if (hover_road_id!==null){
            previewRoadLink();
        }
    }
    else if (MapmakerMode === JUNCTION_2){
        if (hover_road_id!==null){
            previewJuncLink();
            start_lane = -1;
            end_lane = 0;
        }
    }
    else if (MapmakerMode === CREATE_LINE_2){
        previewCreateLine();
    }
    else if (MapmakerMode === EXTEND_ROAD_LINE){
        previewExtendLine();
    }
    else if (MapmakerMode === CREATE_ARC_2){
        previewCreateArc1();
    }
    else if (MapmakerMode === CREATE_ARC_3 || MapmakerMode === EXTEND_ARC){
        previewCreateArc2();
    }
    if(validPreview){
        ModuleOpenDrive.update_road(preview_road, start_lane, end_lane, g_isarc1, g_x1, g_y1, g_hdg1, g_len1, g_cur1, g_two_geo, g_isarc2, g_x2, g_y2, g_hdg2, g_len2, g_cur2);
        preview_mesh = drawRoadMesh(preview_road,preview_mesh);
    }
}

function setMode(mode){
    if (mode == DEFAULT){
        showJuncControls(false);
        scene.remove(handle_mesh);
        scene.remove(preview_mesh);
        scene.remove(arrow1);
    }
    else if (mode == SELECTED){
        showJuncControls(false);
        scene.remove(preview_mesh);
    }
    else if (mode == JUNCTION){
        showJuncControls(true);

        scene.remove(preview_mesh);
    }
    console.log("mode "+mode);
    MapmakerMode = mode;
    mode_info.innerHTML = mode;
}

function onKeyDown(e){
    console.log(e.key);
    if (MapmakerMode === SELECTED){
        if (e.key=='a'){
            let std_vec = ModuleOpenDrive.get_end(OpenDriveMap,sel_road_id,-1);
            g_x1 = std_vec.get(0);
            g_y1 = std_vec.get(1);
            g_hdg1 = std_vec.get(2);
            g_hdg1 = fixHdg(g_hdg1);
            g_isarc1 = true;
            g_two_geo = false;
            g_len2 = 0;
            setMode(EXTEND_ARC);
        }
        if (e.key=='l'){
            let std_vec = ModuleOpenDrive.get_end(OpenDriveMap,sel_road_id,-1);
            g_x1 = std_vec.get(0);
            g_y1 = std_vec.get(1);
            g_hdg1 = std_vec.get(2);
            g_hdg1 = fixHdg(g_hdg1);
            g_isarc1 = false;
            g_two_geo = false;
            g_len2 = 0;
            setMode(EXTEND_ROAD_LINE);
        }
        if (e.key=='s'){
            ModuleOpenDrive.write_road_xml(OpenDriveMap, HANDLE_PARAMS);
            setMode(DEFAULT);
            writeXMLFile();
        }
        if (e.key=='c'){
            setMode(CONNECT);
        }
        if (e.key=='Escape'){
            setMode(DEFAULT);
        }
        if (e.key=='Delete'){
            ModuleOpenDrive.delete_road(OpenDriveMap, sel_road_id);
            setMode(DEFAULT);
            writeXMLFile();
        }
    }
    else if ([CONNECT,EXTEND_ROAD_LINE,EXTEND_ARC].includes(MapmakerMode)){
        if (e.key=='Escape'){
            setMode(SELECTED);
        }
    }
    else if ([CREATE_LINE_1,CREATE_LINE_2,CREATE_ARC_1,CREATE_ARC_2,CREATE_ARC_3].includes(MapmakerMode)){
        if (e.key=='Escape'){
            setMode(DEFAULT);
        }
    }
    else if ([JUNCTION_1,JUNCTION_2].includes(MapmakerMode)){
        if (e.key=='Escape'){
            setMode(JUNCTION);
        }
    }
    else if (MapmakerMode === DEFAULT){
        if (e.key=='a'){
            g_two_geo = false;
            g_len2 = 0;
            setMode(CREATE_ARC_1);
        }
        if (e.key=='l'){
            g_two_geo = false;
            g_len2 = 0;
            setMode(CREATE_LINE_1);
        }
        if (e.key=='j'){
            setMode(JUNCTION);
        }
    }
    else if (MapmakerMode === JUNCTION){
        if (e.key=='n'){
            ModuleOpenDrive.create_new_junction(OpenDriveMap);
            setMode(JUNCTION);
            writeXMLFile();
        }
        if (e.key=='l'){
            setMode(JUNCTION_1);
        }
        if (e.key=='Escape'){
            setMode(DEFAULT);
        }
        if (e.key=='Delete'){
            ModuleOpenDrive.delete_junction(OpenDriveMap, JUNCTION_DATA['junction_id']);
            setMode(JUNCTION);
            writeXMLFile();
        }
    }
    if (e.key=='7'){
        g_start_lane -= 1;
    }
    if (e.key=='8'){
        g_start_lane += 1;
    }
    if (e.key=='9'){
        g_end_lane -= 1;
    }
    if (e.key=='0'){
        g_end_lane += 1;
    }
    g_start_lane = Math.min(g_start_lane,0);
    g_end_lane = Math.max(g_end_lane,0);

}

function onMouseClick(event){

    calcMouseWorldPos(event);

    if (MapmakerMode === CREATE_LINE_1){
        g_x1 = mouse_pos.x;
        g_y1 = mouse_pos.y;
        g_isarc1 = false;
        setMode(CREATE_LINE_2);
    }
    else if (MapmakerMode === CREATE_LINE_2){

        ModuleOpenDrive.add_road(OpenDriveMap, preview_road, "-1", "-1");

        setMode(DEFAULT);
        writeXMLFile();
    }
    else if (MapmakerMode === EXTEND_ROAD_LINE){
        ModuleOpenDrive.add_road(OpenDriveMap, preview_road, sel_road_id, "-1");

        setMode(DEFAULT);
        writeXMLFile();
    }
    else if (MapmakerMode === CREATE_ARC_1){
        g_x1 = mouse_pos.x;
        g_y1 = mouse_pos.y;
        g_isarc1 = true;
        setMode(CREATE_ARC_2);
    }
    else if (MapmakerMode === CREATE_ARC_2){
        g_hdg1 = Math.atan2(mouse_pos.y-g_y1,mouse_pos.x-g_x1);
        setMode(CREATE_ARC_3);
    }
    else if (MapmakerMode === CREATE_ARC_3 || MapmakerMode === EXTEND_ARC){
        if (validPreview){
            ModuleOpenDrive.add_road(OpenDriveMap, preview_road, MapmakerMode === EXTEND_ARC ? sel_road_id : "-1", "-1");

            setMode(DEFAULT);
            writeXMLFile();
        }
    }
    else if (MapmakerMode === DEFAULT){
        if (hover_road_id!==null){
            sel_road_id = hover_road_id;
            sel_lanesec_s0 = hover_lanesec_s0;
            sel_lane_id = hover_lane_id;
            createHandleRoad();
            setMode(SELECTED);
        }
    }
    else if (MapmakerMode === CONNECT){
        if (hover_road_id!==null){
            if (validPreview){
                ModuleOpenDrive.add_road(OpenDriveMap, preview_road, sel_road_id, hover_road_id);
            }
            setMode(DEFAULT);
            writeXMLFile();
        }
    }
    else if (MapmakerMode === JUNCTION_1){
        if (hover_road_id!==null){
            junc_link_start_rid = hover_road_id;
            junc_link_start_lid = hover_lane_id;
            setMode(JUNCTION_2);
        }
    }
    else if (MapmakerMode === JUNCTION_2){
        if (hover_road_id!==null){
            if (validPreview){
                ModuleOpenDrive.add_link(OpenDriveMap, preview_road, JUNCTION_DATA['junction_id'], junc_link_start_rid, junc_link_start_lid, hover_road_id, hover_lane_id);
                setMode(JUNCTION);
                writeXMLFile();
            }
        }
    }
}
