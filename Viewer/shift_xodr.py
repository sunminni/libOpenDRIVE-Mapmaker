import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import random
import math
import numpy as np

filepath = 'maps/JWaterCenter/JWaterCenter_20230703_085511.xodr'
dx,dy=0.2,0
tree = ET.parse(filepath)
OpenDRIVE = tree.getroot()
for road in OpenDRIVE:
    for child in road:
        if child.tag=='planView':
            for geo in child:
                geo.set('x',str(float(geo.get('x'))+dx))
                geo.set('y',str(float(geo.get('y'))+dy))

outputfile = open(filepath,'w')
result = ET.tostring(OpenDRIVE, 'utf-8')
result = minidom.parseString(result)
result = result.toprettyxml(indent="\t")
outputfile.write(result)
outputfile.close()
