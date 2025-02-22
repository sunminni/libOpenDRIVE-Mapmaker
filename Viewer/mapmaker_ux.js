
function showJuncControls(bool){
    if (bool){
        junc_gui.domElement.style.display = 'block';
    }
    else{
        junc_gui.domElement.style.display = 'none';
    }
}

function showRoadControls(bool){
    if (bool){
        road_gui.domElement.style.display = 'block';
    }
    else{
        road_gui.domElement.style.display = 'none';
    }
}

function showPreview(){
    scene.remove(arrow1);
    scene.remove(preview_mesh);
    scene.remove(preview_reflines);
    scene.remove(preview_lanelines);
    
    validPreview = false;
    if (MapmakerMode === CONNECT_1){
        if (hover_road_id!==null){
            previewRoadEnd();
        }
    }
    if (MapmakerMode === CONNECT_2){
        if (hover_road_id!==null){
            previewRoadEnd(false);
            previewRoadLink();
        }
    }
    else if (MapmakerMode === JUNCTION_1){
        if (hover_road_id!==null){
            previewJuncStart();
        }
    }
    else if (MapmakerMode === JUNCTION_2){
        if (hover_road_id!==null){
            previewJuncLink();
            // TODO: need to set lane_datas to contain only one lane
        }
    }
    else if (MapmakerMode === CREATE_LINE_2){
        previewCreateLine();
    }
    else if (MapmakerMode === EXTEND_LINE || MapmakerMode === JUNCTION_EXTEND_LINE){
        previewExtendLine();
    }
    else if (MapmakerMode === CREATE_ARC_2){
        previewCreateArc1();
    }
    else if (MapmakerMode === CREATE_ARC_3 || MapmakerMode === EXTEND_ARC){
        previewCreateArc2();
    }
    else if (MapmakerMode === JUNCTION_EXTEND_ARC){
        if (hover_road_id==null){
            previewCreateArc2();
        }
        else{
            if (hover_road_id!=sel_road_id && junc_link_end_rid==null && junc_link_end_lid==null){
                junc_link_end_rid = hover_road_id;
                junc_link_end_lid = hover_lane_id;
                previewJuncLink2();
            }
            else{
                validPreview = true;
            }
        }
    }
    else if (MapmakerMode === EXTEND){
        if (hover_road_id!==null){
            previewRoadEnd();
        }
    }
    else if (MapmakerMode === JUNCTION_EXTEND){
        if (hover_road_id!==null){
            previewJunctionExtend();
        }
    }
    else if (MapmakerMode === REFLINE){
        selectLine();
    }
    if(validPreview){
        ModuleOpenDrive.update_preview_road(preview_geometries, dictToStdMapIntVecDouble(lane_datas));
        drawPreviewMesh();
    }
}

function setMode(mode){
    if (mode == DEFAULT){
        if(handle_mesh!==null){
            handle_mesh.visible = false;
            handle_lanelines.visible = false;
            handle_reflines.visible = false;
            road_network_mesh.visible = true;
            lane_outline_lines.visible = true;
            for (let arrow of link_arrows){
                arrow.visible = true;
            }
        }
        showJuncControls(false);
        showRoadControls(false);
        resetLaneWidths();
        scene.remove(handle_mesh);
        scene.remove(preview_mesh);
        scene.remove(arrow1);
    }
    else if (mode == SELECTED){
        if(handle_mesh!==null){
            handle_mesh.visible = true;
            handle_lanelines.visible = true;
            handle_reflines.visible = true;
            road_network_mesh.visible = false;
            lane_outline_lines.visible = false;
            for (let arrow of link_arrows){
                arrow.visible = false;
            }
        }
        roadCs["ID"].setValue(sel_road_id);
        showJuncControls(false);
        showRoadControls(true);
        scene.remove(preview_mesh);
    }
    else if (mode == JUNCTION){
        showJuncControls(true);
        showRoadControls(false);
        scene.remove(preview_mesh);
    }
    else if (mode == EXTEND_ARC){
        writeExtend(1);
    }
    else if (mode == EXTEND_LINE){
        writeExtend(0);
    }
    else if (mode == JUNCTION_EXTEND_ARC){
        junc_link_end_rid = null;
        junc_link_end_lid = null;
        writeJuncExtend(1);
    }
    else if (mode == JUNCTION_EXTEND_LINE){
        junc_link_end_rid = null;
        junc_link_end_lid = null;
        writeJuncExtend(0);
    }
    else if ([LINK_ROAD_PRED,LINK_ROAD_SUCC].includes(mode)){
        handle_mesh.visible = true;
        handle_lanelines.visible = true;
        handle_reflines.visible = true;
        road_network_mesh.visible = true;
        lane_outline_lines.visible = true;
        for (let arrow of link_arrows){
            arrow.visible = true;
        }
    }
    // console.log("mode "+mode);
    MapmakerMode = mode;
    mode_info.innerHTML = mode;
}

function onKeyDown(e){
    console.log(e.key);
    if (e.ctrlKey && e.key=='s'){
        // save
        e.preventDefault();
        map_filename = map_folder + '_' + getTimestring()+'.xodr';
        map_filepath = 'maps'+'/'+map_folder+'/'+map_filename;
        writeXMLFile(true);
        return;
    }
    if (e.key=='f'){
        flip = !flip;
        return;
    }
    if (MapmakerMode === SELECTED){
        if (e.key=='Escape'){
            ModuleOpenDrive.write_handle_road_xml(OpenDriveMap, sel_road_id, dictToStdMapIntVecDouble(lane_datas), arrToStdVecDouble(lane_offset));
            writeXMLFile();
            setMode(DEFAULT);
        }
        if (e.key=='Delete'){
            ModuleOpenDrive.delete_road(OpenDriveMap, sel_road_id);
            setMode(DEFAULT);
            writeXMLFile();
        }
        if (e.key=='m'){
            ModuleOpenDrive.merge_to_next_road(OpenDriveMap, sel_road_id);
            writeXMLFile();
        }
    }
    else if ([EXTEND_LINE,EXTEND_ARC].includes(MapmakerMode)){
        if (e.key=='a'){
            setMode(EXTEND_ARC);
        }
        if (e.key=='l'){
            setMode(EXTEND_LINE);
        }
        if (e.key=='Escape'){
            setMode(DEFAULT);
        }
    }
    else if ([CONNECT_1,CONNECT_2,EXTEND].includes(MapmakerMode)){
        if (e.key=='Escape'){
            setMode(DEFAULT);
        }
    }
    else if ([CREATE_LINE_1,CREATE_LINE_2,CREATE_ARC_1,CREATE_ARC_2,CREATE_ARC_3,REFLINE].includes(MapmakerMode)){
        if (e.key=='Escape'){
            setMode(DEFAULT);
        }
    }
    else if ([JUNCTION_1,JUNCTION_2].includes(MapmakerMode)){
        if (e.key=='Escape'){
            setMode(JUNCTION);
        }
    }
    else if (MapmakerMode === SCREENSHOT_ADJUST){
        if (e.key=='w'){
            SCREENSHOT_DY+=0.1;
        }
        if (e.key=='a'){
            SCREENSHOT_DX-=0.1;
        }
        if (e.key=='s'){
            SCREENSHOT_DY-=0.1;
        }
        if (e.key=='d'){
            SCREENSHOT_DX+=0.1;
        }
        if (e.key=='q'){
            SCREENSHOT_ROT-=0.001;
        }
        if (e.key=='e'){
            SCREENSHOT_ROT+=0.001;
        }
        if (e.key=='='){
            SCREENSHOT_SCALE+=0.0001;
        }
        if (e.key=='-'){
            SCREENSHOT_SCALE-=0.0001;
        }
        texture_loader.load(screenshot_filepath, function ( image_texture ) {
            image_texture.rotation = SCREENSHOT_ROT;
            let image_material = new THREE.MeshLambertMaterial({
                map: image_texture
            });
            image_material.transparent = true;
            image_material.opacity = 0.9;
            
            let scale = SCREENSHOT_SCALE;
            let w = image_texture.image.width * scale;
            let h = image_texture.image.height * scale;
            let image_geometry = new THREE.PlaneGeometry(w, h); // width height
            scene.remove(screenshot_mesh);
            screenshot_mesh = new THREE.Mesh(image_geometry, image_material);
            screenshot_mesh.position.set(SCREENSHOT_DX,SCREENSHOT_DY,-0.01);
            scene.add(screenshot_mesh);
        });
        if (e.key=='p'){
            let print_string = "";
            print_string+="SCREENSHOT_ROT = "+SCREENSHOT_ROT+';\n';
            print_string+="SCREENSHOT_SCALE = "+SCREENSHOT_SCALE+';\n';
            print_string+="SCREENSHOT_DX = "+SCREENSHOT_DX+';\n';
            print_string+="SCREENSHOT_DY = "+SCREENSHOT_DY+';\n';
            console.log(print_string);
        }
        if (e.key=='Escape'){
            setMode(DEFAULT);
        }
    }
    else if (MapmakerMode === DEFAULT){
        if (e.key=='e'){
            setMode(EXTEND);
        }
        if (e.key=='c'){
            setMode(CONNECT_1);
        }
        if (e.key=='a'){
            setMode(CREATE_ARC_1);
        }
        if (e.key=='l'){
            setMode(CREATE_LINE_1);
        }
        if (e.key=='j'){
            setMode(JUNCTION);
        }
        if (e.key=='r'){
            resetLaneWidths();
            setMode(REFLINE);
        }
        if (e.key=='z'){
            setMode(SCREENSHOT_ADJUST);
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
        if (e.key=='e'){
            setMode(JUNCTION_EXTEND);
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
    else if (MapmakerMode === JUNCTION_EXTEND){
        if (e.key=='Escape'){
            setMode(JUNCTION);
        }
    }
    else if (MapmakerMode === JUNCTION_EXTEND_ARC){
        if (e.key=='Escape'){
            ModuleOpenDrive.add_road(OpenDriveMap, preview_geometries, dictToStdMapIntVecDouble(lane_datas), sel_road_id, "-1");
            sel_road_id = (ModuleOpenDrive.get_new_road_id(OpenDriveMap)-1).toString();
            setMode(SELECTED);
            writeXMLFile();
        }
        if (e.key=='l'){
            setMode(JUNCTION_EXTEND_LINE);
        }
    }
    else if (MapmakerMode === JUNCTION_EXTEND_LINE){
        if (e.key=='Escape'){
            ModuleOpenDrive.add_road(OpenDriveMap, preview_geometries, dictToStdMapIntVecDouble(lane_datas), sel_road_id, "-1");
            sel_road_id = (ModuleOpenDrive.get_new_road_id(OpenDriveMap)-1).toString();
            setMode(SELECTED);
            writeXMLFile();
        }
        if (e.key=='a'){
            setMode(JUNCTION_EXTEND_ARC);
        }
    }
    else if ([LINK_ROAD_PRED,LINK_ROAD_SUCC].includes(MapmakerMode)){
        if (e.key=='Escape'){
            setMode(SELECTED);
        }
    }
}

function onMouseClick(event){
    if (Math.hypot(event.clientX-startX,event.clientY-startY)>5){
        return;
    }

    calcMouseWorldPos(event);

    if (MapmakerMode === CREATE_LINE_1){
        writeStart(0);
        setMode(CREATE_LINE_2);
    }
    else if (MapmakerMode === CREATE_LINE_2){
        ModuleOpenDrive.add_road(OpenDriveMap, preview_geometries, dictToStdMapIntVecDouble(lane_datas), "-1", "-1");
        sel_road_id = (ModuleOpenDrive.get_new_road_id(OpenDriveMap)-1).toString();
        setMode(SELECTED);
        writeXMLFile();
    }
    else if (MapmakerMode === EXTEND){
        if (hover_road_id!==null){
            sel_near_start = hover_near_start;
            sel_road_id = hover_road_id;
            selectRoad();
            setMode(EXTEND_ARC);
        }
    }
    else if (MapmakerMode === CONNECT_1){
        if (hover_road_id!==null){
            sel_near_start = hover_near_start;
            sel_road_id = hover_road_id;
            selectRoad();
            setMode(CONNECT_2);
        }
    }
    else if (MapmakerMode === EXTEND_LINE){
        ModuleOpenDrive.add_road(OpenDriveMap, preview_geometries, dictToStdMapIntVecDouble(lane_datas), sel_road_id, "-1");
        sel_road_id = (ModuleOpenDrive.get_new_road_id(OpenDriveMap)-1).toString();
        setMode(SELECTED);
        writeXMLFile();
    }
    else if (MapmakerMode === CREATE_ARC_1){
        writeStart(1);
        setMode(CREATE_ARC_2);
    }
    else if (MapmakerMode === CREATE_ARC_2){
        writeHdg(Math.atan2(mouse_pos.y-preview_geometries.get(0).get(2),mouse_pos.x-preview_geometries.get(0).get(1)));
        setMode(CREATE_ARC_3);
    }
    else if (MapmakerMode === CREATE_ARC_3 || MapmakerMode === EXTEND_ARC){
        if (validPreview){
            ModuleOpenDrive.add_road(OpenDriveMap, preview_geometries, dictToStdMapIntVecDouble(lane_datas), MapmakerMode === EXTEND_ARC ? sel_road_id : "-1", "-1");
            sel_road_id = (ModuleOpenDrive.get_new_road_id(OpenDriveMap)-1).toString();
            setMode(SELECTED);
            writeXMLFile();
        }
    }
    else if (MapmakerMode === DEFAULT){
        if (hover_road_id!==null){
            sel_road_id = hover_road_id;
            sel_lanesec_s0 = hover_lanesec_s0;
            sel_lane_id = hover_lane_id;
            selectRoad();
            setMode(SELECTED);
        }
    }
    else if (MapmakerMode === CONNECT_2){
        if (hover_road_id!==null){
            if (validPreview){
                ModuleOpenDrive.add_road(OpenDriveMap, preview_geometries, dictToStdMapIntVecDouble(lane_datas), sel_road_id, hover_road_id);
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
                ModuleOpenDrive.add_link(OpenDriveMap, preview_geometries, dictToStdMapIntVecDouble(lane_datas), JUNCTION_DATA['junction_id'], junc_link_start_rid, junc_link_start_lid, hover_road_id, hover_lane_id);
                setMode(JUNCTION);
                writeXMLFile();
            }
        }
    }
    else if (MapmakerMode === REFLINE){
        if (validPreview){
            ModuleOpenDrive.add_road(OpenDriveMap, preview_geometries, dictToStdMapIntVecDouble(lane_datas), "-1", "-1");
        }
        setMode(REFLINE);
        writeXMLFile();
    }
    else if (MapmakerMode === LINK_ROAD_PRED){
        if (hover_road_id!==null){
            roadCs["pred_id"].domElement.getElementsByTagName('input')[0].value = hover_road_id;
            roadCs["pred_id"].setValue(hover_road_id);
            setMode(SELECTED);
        }
    }
    else if (MapmakerMode === LINK_ROAD_SUCC){
        if (hover_road_id!==null){
            roadCs["succ_id"].domElement.getElementsByTagName('input')[0].value = hover_road_id;
            roadCs["succ_id"].setValue(hover_road_id);
            setMode(SELECTED);
        }
    }
    else if (MapmakerMode === JUNCTION_EXTEND){
        if (hover_road_id!==null){
            sel_road_id = hover_road_id;
            sel_lanesec_s0 = hover_lanesec_s0;
            sel_lane_id = hover_lane_id;
            setMode(JUNCTION_EXTEND_ARC);
        }
    }
    else if (MapmakerMode === JUNCTION_EXTEND_ARC){
        extendJuncExtend(1);
    }
    else if (MapmakerMode === JUNCTION_EXTEND_LINE){
        extendJuncExtend(0);
    }
}
