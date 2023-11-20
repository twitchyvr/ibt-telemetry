const SIZE_IN_BYTES = 32

/**
 * Sub header used when writing telemetry to disk
 *
 * Total size: 32 bytes
 */
class DiskSubHeader {
  constructor (params) {
    Object.assign(this, params)
  }

  /**
   * Instantiate an instance of DiskSubHeader using the contents of the supplied buffer.
   */
  static fromBuffer (buffer) {
    if (buffer.length !== SIZE_IN_BYTES) {
      throw new Error(`Expected buffer length of ${SIZE_IN_BYTES}, but got ${buffer.length}`)
    }

    return new DiskSubHeader({
      startDate: buffer.slice(0, 8).readFloatLE(),
      startTime: buffer.slice(8, 16).readDoubleLE(),
      endTime: buffer.slice(16, 24).readDoubleLE(),
      lapCount: buffer.slice(24, 28).readInt32LE(),
      recordCount: buffer.slice(28, 32).readInt32LE()
    })
  }
}

module.exports = {
  SIZE_IN_BYTES,
  DiskSubHeader
}
