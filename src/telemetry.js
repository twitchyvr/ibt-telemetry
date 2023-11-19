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

    // Check if sessionInfo is not undefined
    if (sessionInfo) {
      try {
        const yamlString = sessionInfo.toString()
        console.log('Raw YAML:', yamlString)
        this.sessionInfo = yaml.load(yamlString) // Make sure to load from yamlString
      } catch (error) {
        console.error('Error parsing YAML:', error)
        this.sessionInfo = {}
      }
    } else {
      console.error('sessionInfo is undefined')
      this.sessionInfo = {}
    }

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
    const accountId = this.sessionInfo && this.sessionInfo.DriverInfo && this.sessionInfo.DriverInfo.Drivers && this.sessionInfo.DriverInfo.Drivers[this.sessionInfo.DriverInfo.DriverCarIdx]
      ? this.sessionInfo.DriverInfo.Drivers[this.sessionInfo.DriverInfo.DriverCarIdx].UserID
      : defaultId
    const sessionId = this.sessionInfo && this.sessionInfo.WeekendInfo && this.sessionInfo.WeekendInfo.SessionID
      ? this.sessionInfo.WeekendInfo.SessionID
      : defaultId
    console.log('Session ID:', sessionId)
    const subSessionId = this.sessionInfo && this.sessionInfo.WeekendInfo && this.sessionInfo.WeekendInfo.SubSessionID
      ? this.sessionInfo.WeekendInfo.SubSessionID
      : defaultId

    // Log the IDs for debugging
    console.log(`Extracted IDs - Account: ${accountId}, Session: ${sessionId}, SubSession: ${subSessionId}`)

    // Concatenate the IDs with safety checks
    return `${accountId}-${sessionId}-${subSessionId}`
  }

  /**
   * Extract Driver Information
   */
  getDriverInfo () {
    if (!this.sessionInfo) return null

    const driverInfo = this.sessionInfo.DriverInfo

    if (!driverInfo) return null

    const driver = driverInfo.Drivers[driverInfo.DriverCarIdx]
    return driver !== undefined && driver !== null ? driver : null
  }

  /**
   * Extract Track Information
   */
  getTrackInfo () {
    if (!this.sessionInfo) return 'Unknown Track'

    const weekendInfo = this.sessionInfo.WeekendInfo

    if (!weekendInfo) return 'Unknown Track'

    return weekendInfo.TrackDisplayName !== undefined && weekendInfo.TrackDisplayName !== null ? weekendInfo.TrackDisplayName : 'Unknown Track'
  }

  /**
   * Extract Vehicle Information
   */
  getVehicleInfo () {
    if (!this.sessionInfo) return 'Unknown Vehicle'

    const driverInfo = this.sessionInfo.DriverInfo

    if (!driverInfo) return 'Unknown Vehicle'

    return driverInfo.DriverCarDescription !== undefined && driverInfo.DriverCarDescription !== null ? driverInfo.DriverCarDescription : 'Unknown Vehicle'
  }

  getSessionType () {
    if (!this.sessionInfo || !this.sessionInfo.WeekendInfo) return 'Unknown Session Type'

    return this.sessionInfo.WeekendInfo.SessionType || 'Unknown Session Type'
  }

  getTelemetryDataSummary () {
    let totalSpeed = 0
    let maxRpm = 0
    let totalLaps = 0
    let bestLapTime = Number.MAX_VALUE
    const lapTimes = []
    let highestSpeed = 0
    let totalBrakePressure = 0
    let totalThrottle = 0
    let sampleCount = 0

    for (const sample of this.samples()) {
      totalSpeed += sample.speed
      maxRpm = Math.max(maxRpm, sample.rpm)
      highestSpeed = Math.max(highestSpeed, sample.speed)
      totalBrakePressure += sample.brakePressure
      totalThrottle += sample.throttle
      sampleCount++

      // Assuming sample.lapTime and sample.lapNumber are available
      if (sample.lapTime < bestLapTime) {
        bestLapTime = sample.lapTime
      }
      if (!lapTimes[sample.lapNumber]) {
        lapTimes[sample.lapNumber] = []
      }
      lapTimes[sample.lapNumber].push(sample.lapTime)
    }

    totalLaps = lapTimes.length

    // Calculate averages
    const avgSpeed = totalSpeed / sampleCount
    const avgBrakePressure = totalBrakePressure / sampleCount
    const avgThrottle = totalThrottle / sampleCount

    return {
      averageSpeed: avgSpeed,
      maxRPM: maxRpm,
      totalLaps,
      bestLapTime,
      highestSpeed,
      averageBrakePressure: avgBrakePressure,
      averageThrottle: avgThrottle,
      lapTimes: lapTimes.map(lap => lap.reduce((a, b) => a + b, 0) / lap.length)
    }
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
