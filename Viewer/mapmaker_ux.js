function showRoadControls(bool){
    if (bool){
        new_road_gui.domElement.style.display = 'block';
    }
    else{
        new_road_gui.domElement.style.display = 'none';
    }
}

function showPreview(){
    if (MapmakerMode === CONNECT){
        scene.remove(preview_mesh[0]);
        scene.remove(preview_mesh[1]);
        if (sel_road_id!==null){
            previewLink();
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
}

function setMode(mode){
    if (mode == DEFAULT){
        showRoadControls(false);
        scene.remove(handle_mesh);
        scene.remove(preview_mesh[0]);
        scene.remove(preview_mesh[1]);
        scene.remove(arrow1);
    }
    else if (mode == SELECTED){
        showRoadControls(true);
        scene.remove(preview_mesh[0]);
        scene.remove(preview_mesh[1]);
    }
    else if (mode == CONNECT){
        showRoadControls(true);
    }
    console.log("mode "+mode);
    MapmakerMode = mode;
    mode_info.innerHTML = mode;
}

function onKeyDown(e){
    console.log(e.key);
    if (MapmakerMode === SELECTED){
        if (e.key=='a'){
            let std_vec = ModuleOpenDrive.get_end(HANDLE_PARAMS);
            PREVIEW_PARAMS[0].x = std_vec.get(0);
            PREVIEW_PARAMS[0].y = std_vec.get(1);
            PREVIEW_PARAMS[0].hdg = std_vec.get(2);
            PREVIEW_PARAMS[0].line_type = "arc";
            setMode(EXTEND_ARC);
        }
        if (e.key=='l'){
            let std_vec = ModuleOpenDrive.get_end(HANDLE_PARAMS);
            PREVIEW_PARAMS[0].x = std_vec.get(0);
            PREVIEW_PARAMS[0].y = std_vec.get(1);
            PREVIEW_PARAMS[0].hdg = std_vec.get(2);
            PREVIEW_PARAMS[0].line_type = "line";
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
            ModuleOpenDrive.delete_road(OpenDriveMap, HANDLE_PARAMS);
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
    else if (MapmakerMode === DEFAULT){
        if (e.key=='a'){
            setMode(CREATE_ARC_1);
        }
        if (e.key=='l'){
            setMode(CREATE_LINE_1);
        }
    }
}

function onMouseClick(event){

    calcMouseWorldPos(event);

    if (MapmakerMode === CREATE_LINE_1){
        PREVIEW_PARAMS[0].x = mouse_pos.x;
        PREVIEW_PARAMS[0].y = mouse_pos.y;
        PREVIEW_PARAMS[0].line_type = "line";
        setMode(CREATE_LINE_2);
    }
    else if (MapmakerMode === CREATE_LINE_2){
        PREVIEW_PARAMS[0].road_length = Math.hypot(PREVIEW_PARAMS[0].x-mouse_pos.x, PREVIEW_PARAMS[0].y-mouse_pos.y);
        PREVIEW_PARAMS[0].hdg = Math.atan2(mouse_pos.y-PREVIEW_PARAMS[0].y,mouse_pos.x-PREVIEW_PARAMS[0].x);
        ModuleOpenDrive.add_road(OpenDriveMap, PREVIEW_PARAMS[0]);
        setMode(DEFAULT);
        writeXMLFile();
    }
    else if (MapmakerMode === EXTEND_ROAD_LINE){
        PREVIEW_PARAMS[0].road_length = Math.hypot(PREVIEW_PARAMS[0].x-mouse_pos.x, PREVIEW_PARAMS[0].y-mouse_pos.y);
        ModuleOpenDrive.add_road(OpenDriveMap, PREVIEW_PARAMS[0]);
        setMode(DEFAULT);
        writeXMLFile();
    }
    else if (MapmakerMode === CREATE_ARC_1){
        PREVIEW_PARAMS[0].x = mouse_pos.x;
        PREVIEW_PARAMS[0].y = mouse_pos.y;
        PREVIEW_PARAMS[0].line_type = "arc";
        setMode(CREATE_ARC_2);
    }
    else if (MapmakerMode === CREATE_ARC_2){
        PREVIEW_PARAMS[0].hdg = Math.atan2(mouse_pos.y-PREVIEW_PARAMS[0].y,mouse_pos.x-PREVIEW_PARAMS[0].x);
        setMode(CREATE_ARC_3);
    }
    else if (MapmakerMode === CREATE_ARC_3 || MapmakerMode === EXTEND_ARC){
        if (validPreview[0]){
            ModuleOpenDrive.add_road(OpenDriveMap, PREVIEW_PARAMS[0]);
            setMode(DEFAULT);
            writeXMLFile();
        }
    }

    if (sel_road_id!==null){
        if (MapmakerMode === DEFAULT){
            console.log(sel_road_id);
            console.log(sel_lanesec_s0);
            console.log(sel_lane_id);
            HANDLE_PARAMS.road_id = sel_road_id;
            createHandleRoad();
            setMode(SELECTED);
        }
        else if (MapmakerMode === CONNECT){
            if (validPreview[0]){
                //make roads
                ModuleOpenDrive.add_road(OpenDriveMap, PREVIEW_PARAMS[0]);
                if (validPreview[1]){
                    ModuleOpenDrive.add_road(OpenDriveMap, PREVIEW_PARAMS[1]);
                }
                setMode(DEFAULT);
                writeXMLFile();
            }
        }
    }
}

function updateControllerDisplay(){
    road_idC.updateDisplay();
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
        curvatureC = makeCurvatureC();
    }
    if (curvatureC!==null) curvatureC.updateDisplay();
    predetC.updateDisplay();
    predeiC.updateDisplay();
    predcpC.updateDisplay();
    succC.updateDisplay();
}