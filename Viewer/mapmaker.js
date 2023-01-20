function onKeyDown(e){
    console.log(e.key);
    if (e.key=='a'){
        addRoad();
    }
    if (e.key=='g'){
        let std_vec = ModuleOpenDrive.get_road_ids(OpenDriveMap);
        console.log(std_vec.size());

        // for (let idx = 0; idx < std_vec.size(); idx++){
        //     console.log(std_vec.get(idx));
        // }
    }
}

function addRoad(){
    const road = ModuleOpenDrive.create_new_road(OpenDriveMap, parseFloat(PARAMS.resolution));
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

function updateNewRoad(){
    scene.remove(road_network_mesh_new);
    addRoad();
}