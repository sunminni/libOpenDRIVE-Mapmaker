import xsensdeviceapi as xda
import time
from threading import Lock
import os
import math

class XdaCallback(xda.XsCallback):
    def __init__(self):
        xda.XsCallback.__init__(self)
        self.m_progress = 0
        self.m_lock = Lock()

    def progress(self):
        return self.m_progress

    def onProgressUpdated(self, dev, current, total, identifier):
        self.m_lock.acquire()
        self.m_progress = current
        self.m_lock.release()


if __name__ == '__main__':
    print("Creating XsControl object...")
    control = xda.XsControl_construct()
    assert(control is not 0)

    xdaVersion = xda.XsVersion()
    xda.xdaVersion(xdaVersion)
    print("Using XDA version %s" % xdaVersion.toXsString())

    folder = "mt_log_data"
    files = os.listdir(folder)
    for file in files:
        if not file.endswith('.mtb'):
            continue
        filepath = os.path.join(folder,file)
        print("Opening log file...")
        if not control.openLogFile(filepath):
            raise RuntimeError("Failed to open log file. Aborting.")
        print("Opened log file: %s" % filepath)

        deviceIdArray = control.mainDeviceIds()
        for i in range(deviceIdArray.size()):
            if deviceIdArray[i].isMti() or deviceIdArray[i].isMtig():
                mtDevice = deviceIdArray[i]
                break

        if not mtDevice:
            raise RuntimeError("No MTi device found. Aborting.")

        # Get the device object
        device = control.device(mtDevice)
        assert(device is not 0)

        print("Device: %s, with ID: %s found in file" % (device.productCode(), device.deviceId().toXsString()))

        # Create and attach callback handler to device
        callback = XdaCallback()
        device.addCallbackHandler(callback)

        # By default XDA does not retain data for reading it back.
        # By enabling this option XDA keeps the buffered data in a cache so it can be accessed 
        # through XsDevice::getDataPacketByIndex or XsDevice::takeFirstDataPacketInQueue
        device.setOptions(xda.XSO_RetainBufferedData, xda.XSO_None);

        # Load the log file and wait until it is loaded
        # Wait for logfile to be fully loaded, there are three ways to do this:
        # - callback: Demonstrated here, which has loading progress information
        # - waitForLoadLogFileDone: Blocking function, returning when file is loaded
        # - isLoadLogFileInProgress: Query function, used to query the device if the loading is done
        #
        # The callback option is used here.

        print("Loading the file...")
        device.loadLogFile()
        while callback.progress() != 100:
            time.sleep(0)
        print("File is fully loaded")


        # Get total number of samples
        packetCount = device.getDataPacketCount()

        # Export the data
        print("Exporting the data...")
        s = ''
        s2 = ''
        index = 0
        while index < packetCount:
            # Retrieve a packet
            packet = device.getDataPacketByIndex(index)
            if not (packet.containsOrientation() and packet.containsLatitudeLongitude()):
                index += 1
                continue
            if packet.containsCalibratedData():
                acc = packet.calibratedAcceleration()
                s += "Acc X: %.2f" % acc[0] + ", Acc Y: %.2f" % acc[1] + ", Acc Z: %.2f" % acc[2]

                gyr = packet.calibratedGyroscopeData()
                s += " |Gyr X: %.2f" % gyr[0] + ", Gyr Y: %.2f" % gyr[1] + ", Gyr Z: %.2f" % gyr[2]

                mag = packet.calibratedMagneticField()
                s += " |Mag X: %.2f" % mag[0] + ", Mag Y: %.2f" % mag[1] + ", Mag Z: %.2f" % mag[2]

            if packet.containsOrientation():
                quaternion = packet.orientationQuaternion()
                s += "q0: %.2f" % quaternion[0] + ", q1: %.2f" % quaternion[1] + ", q2: %.2f" % quaternion[2] + ", q3: %.2f " % quaternion[3]

                euler = packet.orientationEuler()
                s += " |Roll: %.2f" % euler.x() + ", Pitch: %.2f" % euler.y() + ", Yaw: %.2f " % euler.z()
                s2+= ","+str(euler.z())
            if packet.containsLatitudeLongitude():
                latlon = packet.latitudeLongitude()
                s += " |Lat: %7.2f" % latlon[0] + ", Lon: %7.2f " % latlon[1]
                s2+= ","+str(latlon[0])+","+str(latlon[1])

            if packet.containsAltitude():
                s += " |Alt: %7.2f " % packet.altitude()

            if packet.containsVelocity():
                vel = packet.velocity(xda.XDI_CoordSysEnu)
                s += " |E: %7.2f" % vel[0] + ", N: %7.2f" % vel[1] + ", U: %7.2f " % vel[2]

            s += "\n"
            s2 += "\r\n"

            index += 1

        exportFileName = filepath.replace('.mtb','.beyless')
        with open(exportFileName, "w") as outfile:
            outfile.write(s2)
        print("File is exported to: %s" % exportFileName)

        print("Removing callback handler...")
        device.removeCallbackHandler(callback)

        print("Closing XsControl object...")
        control.close()
