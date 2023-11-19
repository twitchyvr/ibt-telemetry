const TelemetrySample = require('./telemetry-sample')
const telemetryFileLoader = require('./utils/telemetry-file-loader')
const fs = require('fs')
const yaml = require('js-yaml')
const variableHeaders = new WeakMap()
const fileDescriptor = new WeakMap()

/**
 * iRacing Telemetry
 */
class Telemetry {
  /**
   * Telemetry constructor.
   */
  constructor (telemetryHeader, diskSubHeader, sessionInfo, varHeaders, fd) {
    this.headers = telemetryHeader
    this.diskHeaders = diskSubHeader
    this.sessionInfo = yaml.load(sessionInfo)

    fileDescriptor.set(this, fd)
    variableHeaders.set(this, varHeaders)
  }

  /**
   * Instantiate a Telemetry instance from the contents of an ibt file
   *
   * @param file path to *.ibt file
   * @return Telemetry instance of telemetry
   */
  static fromFile (file) {
    return telemetryFileLoader(file)
  }

  /**
   * Telemetry variable headers.
   */
  get varHeaders () {
    return variableHeaders.get(this)
  }

  /**
   * Generate a unique key for the telemetry session.
   *
   * The unique key is a combination of 3 fields:
   *   accountId-sessionId-subSessionId
   *
   * @return string
   */
  uniqueId () {
    // Default values to indicate missing or unavailable data
    const defaultId = 'Unknown'

    // Safely access nested properties
    const accountId = this.sessionInfo && this.sessionInfo.DriverInfo && Array.isArray(this.sessionInfo.DriverInfo.Drivers) &&
      this.sessionInfo.DriverInfo.Drivers[this.sessionInfo.DriverInfo.DriverCarIdx]
      ? this.sessionInfo.DriverInfo.Drivers[this.sessionInfo.DriverInfo.DriverCarIdx].UserID
      : defaultId

    const sessionId = this.sessionInfo && this.sessionInfo.WeekendInfo
      ? this.sessionInfo.WeekendInfo.SessionID
      : defaultId

    const subSessionId = this.sessionInfo && this.sessionInfo.WeekendInfo
      ? this.sessionInfo.WeekendInfo.SubSessionID
      : defaultId

    // Concatenate the IDs with safety checks
    return `${accountId}-${sessionId}-${subSessionId}`
  }
  
  /**
   * Telemetry samples generator.
   */
  * samples () {
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
