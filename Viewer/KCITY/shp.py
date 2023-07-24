import geopandas as gpd
import numpy as np
import matplotlib.pyplot as plt
import os
import time
# color = ['black', 'darkorange', 'red', 'green', 'yellow', 'saddlebrown', 'cyan', 'purple', 'violet']
# address = './SEC01_첨단주행시험로/HDMap_UTM52N_타원체고/'
# address = './SEC01_첨단주행시험로/HDMap_UTMK_정표고/'
address = './SEC01_첨단주행시험로/HDMap_UTMK_타원체고/'   # NAVER MAP!!

info = list(filter(lambda x: 'SURFACELINEMARK.shp' in x, os.listdir(address)))
datas = []
# plt.rcParams['figure.figsize'] = (10, 10) 
# plt.rcParams['lines.linewidth'] = 1 
# plt.rcParams['lines.markersize'] = 3 
lineID = 0
for i in info:
    print(i)
    df = gpd.read_file(address + i)[['Type','geometry']]
    for index, row in df.iterrows():
        lineString = row['geometry']
        if "LINESTRING" in str(lineString):
            lineID += 1
            for x, y, z in lineString.coords:
                datas.append([float(row['Type']),lineID,float(x),float(y),float(z)])
np_data = np.array(datas)
np_data = np_data.astype(np.float32)
# mins = np.min(np_data,0)
np_data = np_data.flatten()
# np_data = np.insert(np_data, 0, mins[2:4], axis=None)
np_data.tofile("KCITY_LINES.bin")

# x = 935655
# y = 1916235
# dxdy = 30
# dd = time.time()
# ax = datas[0].plot()
# for i, data in enumerate(datas[1:]):
#     data.plot(color=color[i], ax=ax)
# plt.xlim([x-dxdy/2, x+dxdy/2])
# plt.ylim([y+dxdy/2, y-dxdy/2])
# plt.axis('off')
# plt.show()
# print(dd - time.time())

address = './SEC01_첨단주행시험로/HDMap_UTMK_타원체고/'   # NAVER MAP!!
info = list(filter(lambda x: 'SPEEDBUMP.shp' in x, os.listdir(address)))

datas = []
for i in info:
    print(i)
    df = gpd.read_file(address + i)[['Type','geometry']]
    print(df)
    for index, row in df.iterrows():
        polygon = row['geometry']
        if "POLYGON" in str(polygon):
            lineID += 1
            # print(type(polygon))
            # for i in dir(polygon):
            #     print(i)
            for i in polygon.exterior.coords:
                x,y,z = i
                datas.append([float(row['Type']),lineID,float(x),float(y),float(z)])
            # print(polygon.exterior.coords)
            # for x, y, z in polygon.coords:
            #     datas.append([float(row['Type']),lineID,float(x),float(y),float(z)])
np_data = np.array(datas)
np_data = np_data.astype(np.float32)
np_data = np_data.flatten()
np_data.tofile("KCITY_SPEEDBUMPS.bin")


address = './SEC01_첨단주행시험로/HDMap_UTMK_타원체고/'   # NAVER MAP!!
info = list(filter(lambda x: 'SURFACEMARK.shp' in x, os.listdir(address))) 

datas = []
for i in info:
    print(i)
    df = gpd.read_file(address + i)[['Type','geometry']]
    for index, row in df.iterrows():
        polygon = row['geometry']
        if "POLYGON" in str(polygon):
            lineID += 1
            for x, y, z in polygon.exterior.coords:
                datas.append([float(row['Type']),lineID,float(x),float(y),float(z)])
np_data = np.array(datas)
np_data = np_data.astype(np.float32)
np_data = np_data.flatten()
np_data.tofile("KCITY_SURFACEMARKS.bin")
