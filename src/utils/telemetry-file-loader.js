const fs = require('fs')
const R = require('ramda')
const { SIZE_IN_BYTES: HEADER_SIZE_IN_BYTES, TelemetryHeader } = require('../headers/telemetry-header')
const { SIZE_IN_BYTES: DISK_SUB_HEADER_SIZE_IN_BYTES, DiskSubHeader } = require('../headers/disk-sub-header')
const { SIZE_IN_BYTES: VAR_HEADER_SIZE_IN_BYTES, VarHeader } = require('../headers/var-header')
const readFileToBuffer = require('../utils/read-file-to-buffer')
const Telemetry = require('../telemetry')
const yaml = require('js-yaml')

// Utility function to log and check if a value is a number
function isNumber (value, name) {
  if (typeof value !== 'number' || isNaN(value)) {
    console.error(`${name} is not a number. Received:`, value)
    return false
  }
  return true
}

const openDataFile = dataFile => new Promise((resolve, reject) => {
  fs.open(dataFile, 'r', (err, fd) => {
    err ? reject(err) : resolve(fd)
  })
})

// Return the Telemetry header from the supplied file descriptor
const telemetryHeaderFromFileDescriptor = fd =>
  readFileToBuffer(fd, 0, HEADER_SIZE_IN_BYTES)
    .then(TelemetryHeader.fromBuffer)

// Disk sub header telemetry
const diskSubHeaderFromFileDescriptor = fd =>
  readFileToBuffer(fd, DISK_SUB_HEADER_SIZE_IN_BYTES, HEADER_SIZE_IN_BYTES)
    .then(DiskSubHeader.fromBuffer)

const sessionInfoStringFromFileDescriptor = (fd, telemetryHeader) => {
  if (!isNumber(telemetryHeader.sessionInfoOffset, 'sessionInfoOffset') ||
    !isNumber(telemetryHeader.sessionInfoLength, 'sessionInfoLength')) {
    return Promise.reject(new Error('Invalid session info offset or length'))
  }

  return readFileToBuffer(fd, telemetryHeader.sessionInfoOffset, telemetryHeader.sessionInfoLength)
    .then(buffer => {
      return buffer.toString('ascii')
    })
}

const varHeadersFromFileDescriptor = (fd, telemetryHeader) => {
  if (!isNumber(telemetryHeader.numVars, 'numVars')) {
    return Promise.reject(new Error('Invalid number of variables (numVars)'))
  }

  const numberOfVariables = telemetryHeader.numVars
  const startPosition = telemetryHeader.varHeaderOffset
  const fullBufferSize = numberOfVariables * VAR_HEADER_SIZE_IN_BYTES

  return readFileToBuffer(fd, startPosition, fullBufferSize)
    .then(buffer => {
      return R.range(0, numberOfVariables).map(count => {
        const start = count * VAR_HEADER_SIZE_IN_BYTES
        const end = start + VAR_HEADER_SIZE_IN_BYTES
        return VarHeader.fromBuffer(buffer.slice(start, end))
      })
    })
}

const telemetryFileLoader = (buffer) => {
  try {
    // Assuming the buffer contains the entire .ibt file content
    // Extract the headers and other information from the buffer
    const telemetryHeader = TelemetryHeader.fromBuffer(buffer.slice(0, HEADER_SIZE_IN_BYTES))
    const diskSubHeader = DiskSubHeader.fromBuffer(buffer.slice(HEADER_SIZE_IN_BYTES, HEADER_SIZE_IN_BYTES + DISK_SUB_HEADER_SIZE_IN_BYTES))

    // Extract and parse the YAML session info
    const sessionInfoStart = telemetryHeader.sessionInfoOffset
    const sessionInfoLength = telemetryHeader.sessionInfoLength
    const sessionInfoString = sessionInfoStringFromFileDescriptor(fd, telemetryHeader)
    const sessionInfo = yaml.load(sessionInfoString)

    // Extract variable headers
    const varHeadersStart = telemetryHeader.varHeaderOffset
    const varHeaders = []
    for (let i = 0; i < telemetryHeader.numVars; i++) {
      const start = varHeadersStart + i * VAR_HEADER_SIZE_IN_BYTES
      const varHeader = VarHeader.fromBuffer(buffer.slice(start, start + VAR_HEADER_SIZE_IN_BYTES))
      varHeaders.push(varHeader)
    }

    // Create and return the Telemetry instance with sessionInfo
    return new Telemetry(telemetryHeader, diskSubHeader, sessionInfo, varHeaders, fd)
  } catch (error) {
    console.error('Error processing telemetry buffer:', error)
    throw error // Rethrow to handle the error outside
  }
}

module.exports = telemetryFileLoader
