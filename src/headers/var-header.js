const SIZE_IN_BYTES = 144

/**
 *
 * Total size: 144 bytes
 */
class VarHeader {
  /**
  * Create a VarHeader instance.
  *
  * @param {Object} params - Parameters for the header
  */
  constructor (params) {
    if (!params.name) {
      throw new Error('VarHeader requires a name')
    }

    const headerParams = {
      type: 0,
      offset: '',
      count: 0,
      countAsTime: 0,
      name: '',
      description: '',
      unit: ''
    }

    Object.assign(this, headerParams)
  }

  get name () {
    return this._name
  }

  get type () {
    return this._type
  }

  /**
   * Create VarHeader from a buffer.
   *
   * @param {Buffer} buffer - Buffer containing the header data
   * @returns {VarHeader}
   */
  static fromBuffer (buffer) {
    if (buffer.length !== SIZE_IN_BYTES) {
      throw new RangeError(`Buffer length for VarHeader needs to be ${SIZE_IN_BYTES}, supplied ${buffer.length}`)
    }

    return new VarHeader({
      type: buffer.slice(0, 4).readInt32LE(),
      offset: buffer.slice(4, 8).readInt32LE(),
      count: buffer.slice(8, 12).readInt32LE(),
      countAsTime: buffer.slice(12, 13).readInt8(),
      // padding here, 16 byte align (3 bytes)
      name: buffer.slice(16, 48).toString().replace(/\0/g, ''),
      description: buffer.slice(48, 112).toString().replace(/\0/g, ''),
      unit: buffer.slice(112, 144).toString().replace(/\0/g, '')
    })
  }
}

module.exports = {
  SIZE_IN_BYTES,
  VarHeader
}
