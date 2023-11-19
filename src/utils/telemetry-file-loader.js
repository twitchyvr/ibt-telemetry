const fs = require('fs')
const R = require('ramda')
const { SIZE_IN_BYTES: HEADER_SIZE_IN_BYTES, TelemetryHeader } = require('../headers/telemetry-header')
const { SIZE_IN_BYTES: DISK_SUB_HEADER_SIZE_IN_BYTES, DiskSubHeader } = require('../headers/disk-sub-header')
const { SIZE_IN_BYTES: VAR_HEADER_SIZE_IN_BYTES, VarHeader } = require('../headers/var-header')
const readFileToBuffer = require('../utils/read-file-to-buffer')
const Telemetry = require('../telemetry')

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

const sessionInfoStringFromFileDescriptor = (fd, telemetryHeader) =>
  readFileToBuffer(fd, telemetryHeader.sessionInfoOffset, telemetryHeader.sessionInfoLength)
    .then(x => x.toString('ascii'))

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

const telemetryFileLoader = (file) => {
  return openDataFile(file)
    .then(fd => {
      const headers = [
        telemetryHeaderFromFileDescriptor(fd),
        diskSubHeaderFromFileDescriptor(fd)
      ]

      return Promise.all(headers)
        .then(([telemetryHeader, diskSubHeader]) => {
          return Promise.all([
            sessionInfoStringFromFileDescriptor(fd, telemetryHeader),
            varHeadersFromFileDescriptor(fd, telemetryHeader)
          ]).then(([sessionInfo, varHeaders]) => {
            return new Telemetry(telemetryHeader, diskSubHeader, sessionInfo, varHeaders, fd)
          })
        })
    })
}

module.exports = telemetryFileLoader
