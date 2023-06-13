import dxfgrabber
import numpy as np
dxf = dxfgrabber.readfile("WATER_CENTER.dxf")
entities = dxf.entities.get_entities()

lineID = 0
datas = []

for e in entities:
    if(e.__class__==dxfgrabber.dxfentities.Polyline):
        points = e.points
        lineID += 1
        for p in points:
            datas.append([0,lineID,float(p[0]),float(p[1]),0])

np_data = np.array(datas)
np_data = np_data.astype(np.float32)
mins = np.min(np_data,0)
np_data = np_data.flatten()
np_data = np.insert(np_data, 0, mins[2:4], axis=None)
# np_data.tofile("KCITY_LINES.bin")
np_data.tofile("WATER_CENTER/WATER_CENTER.bin")