from flask import Flask,request
from flask_cors import CORS
import numpy as np
import warnings

warnings.simplefilter('ignore', np.RankWarning)

arr = np.fromfile("KCITY/KCITY_LINES.bin", dtype=np.float32)
x_offset,y_offset = arr[:2]
arr = arr[2:].reshape((-1,5))
app = Flask(__name__)
CORS(app)

@app.route('/fit', methods=['POST'])
def fit():
    global arr
    line_id = int(request.get_json()['line_id'])
    xy = arr[arr[:,1]==line_id][:,2:4]
    x = xy[:,0]-x_offset
    y = xy[:,1]-y_offset
    if x[0]>x[-1]:
        x = x-x[-1]
        y = y-y[-1]
    else:
        x = x-x[0]
        y = y-y[0]
    poly1 = list(np.polyfit(x,y,1).flatten())
    poly2 = list(np.polyfit(x,y,2).flatten())
    poly3 = list(np.polyfit(x,y,3).flatten())
    # a,b,c,d = poly3
    # if x[0]<x[-1]:
    #     xs = x[0]
    #     ys = y[0]
    #     xe = x[-1]
    #     ye = y[-1]
    # else:
    #     xs = x[-1]
    #     ys = y[-1]
    #     xe = x[0]
    #     ye = y[0]

    # m = 3*a*xs**2+2*b*xs+c
    # m_ = -1/m
    # B = ys-m_*xs
    # temp_poly = np.polynomial.polynomial.Polynomial([d-B,c-m_,b,a])
    # roots = []
    # for r in list(temp_poly.roots()):
    #     if isinstance(r, complex):
    #         if r.imag == 0:
    #             roots.append(r.real)
    #     else:
    #         roots.append(r)
    # return {'line':poly1,"poly":poly3+roots}
    return {'poly1':poly1,"poly2":poly2,"poly3":poly3}

if __name__ == '__main__':
    app.run(host="localhost", port=8001, debug=True)