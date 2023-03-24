from flask import Flask,request
import numpy as np

app = Flask(__name__)

@app.route('/fit', methods=['POST'])
def fit():
    data = request.get_json()
    fit_type = data['fit_type'] # line, arc, poly
    arr = data['arr']
    arr = np.array(arr).reshape((-1,2))
    if fit_type=="line":
        return {'result':np.polyfit(arr[:,0],arr[:,1],1)}
    elif fit_type=="poly":
        return {'result':np.polyfit(arr[:,0],arr[:,1],3)}
    elif fit_type=="arc":
        pass

if __name__ == '__main__':
    app.run(host="localhost", port=8001, debug=True)