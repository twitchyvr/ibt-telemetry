const TelemetrySample = require('./telemetry-sample')
const telemetryFileLoader = require('./utils/telemetry-file-loader')
const fs = require('fs')
const yaml = require('js-yaml')
const variableHeaders = new WeakMap()
const fileDescriptor = new WeakMap()

class Telemetry {
  constructor(telemetryHeader, diskSubHeader, sessionInfo, varHeaders, fd) {
    this.headers = telemetryHeader
    this.diskHeaders = diskSubHeader
    this.sessionInfo = yaml.safeLoad(sessionInfo)

    fileDescriptor.set(this, fd)
    variableHeaders.set(this, varHeaders)
  }

  static fromFile(file) {
    return telemetryFileLoader(file)
  }

  get varHeaders() {
    return variableHeaders.get(this)
  }

  uniqueId() {
    const accountId = this.sessionInfo.DriverInfo.Drivers[this.sessionInfo.DriverInfo.DriverCarIdx].UserID
    const sessionId = this.sessionInfo.WeekendInfo.SessionID
    const subSessionId = this.sessionInfo.WeekendInfo.SubSessionID
    return `${accountId}-${sessionId}-${subSessionId}`
  }

  * samples() {
    let hasSample = true
    let count = 0

    const fd = fileDescriptor.get(this)
    const length = this.headers.bufLen
    const buffer = Buffer.alloc(length)

    while (hasSample) {
      const start = this.headers.bufOffset + (count++ * length)
      const bytesRead = fs.readSync(fd, buffer, 0, length, start)

      if (bytesRead !== length) {
        hasSample = false
      } else {
        yield new TelemetrySample(buffer, this.varHeaders)
      }
    }
  }
}

module.exports = Telemetry
