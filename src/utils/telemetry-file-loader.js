const fs = require('fs')
const R = require('ramda')
const { SIZE_IN_BYTES: HEADER_SIZE_IN_BYTES, TelemetryHeader } = require('../headers/telemetry-header')
const { SIZE_IN_BYTES: DISK_SUB_HEADER_SIZE_IN_BYTES, DiskSubHeader } = require('../headers/disk-sub-header')
const { SIZE_IN_BYTES: VAR_HEADER_SIZE_IN_BYTES, VarHeader } = require('../headers/var-header')
const readFileToBuffer = require('../utils/read-file-to-buffer')
const Telemetry = require('../telemetry')
const yaml = require('js-yaml')

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

/**
const sessionInfoStringFromFileDescriptor = (fd, telemetryHeader) =>
readFileToBuffer(fd, telemetryHeader.sessionInfoOffset, telemetryHeader.sessionInfoLength)
.then(x => x.toString('ascii'))
*/

const sessionInfoStringFromFileDescriptor = (fd, telemetryHeader) => {
  return readFileToBuffer(fd, telemetryHeader.sessionInfoOffset, telemetryHeader.sessionInfoLength)
    .then(buffer => {
      return buffer.toString('ascii') // encode as ascii
    })
}

const varHeadersFromFileDescriptor = (fd, telemetryHeader) => {
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
