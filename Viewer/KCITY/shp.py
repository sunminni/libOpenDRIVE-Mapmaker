import geopandas as gpd
import numpy as np
import matplotlib.pyplot as plt
import os
import time
color = ['black', 'darkorange', 'red', 'green', 'yellow', 'saddlebrown', 'cyan', 'purple', 'violet']
address = './SEC01_첨단주행시험로/HDMap_UTM52N_타원체고/'
address = './SEC01_첨단주행시험로/HDMap_UTMK_정표고/'
address = './SEC01_첨단주행시험로/HDMap_UTMK_타원체고/'

info = list(filter(lambda x: 'SURFACELINEMARK.shp' in x, os.listdir(address)))
datas = []
plt.rcParams['figure.figsize'] = (10, 10) 
plt.rcParams['lines.linewidth'] = 1 
plt.rcParams['lines.markersize'] = 3 
for i in info:
    datas.append(gpd.read_file(address + i, encoding='utf-8'))

df = datas[0][['Type','geometry']]
data = []
lineID = 0
for index, row in df.iterrows():
    lineString = row['geometry']
    lineID += 1
    for x, y, z in lineString.coords:
        data.append([float(row['Type']),lineID,float(x),float(y),float(z)])
np_data = np.array(data)
np_data = np_data.astype(np.float32)
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