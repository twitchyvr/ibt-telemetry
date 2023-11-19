/**
 * iRacing ibt telemetry parser.

import Telemetry from './telemetry'
import Sample from './telemetry-sample'
import readFileToBuffer from './utils/read-file-to-buffer'
import telemetryFileLoader from './utils/telemetry-file-loader'
import irsdkConstants from './irsdk-constants'

export {
  Telemetry,
  Telemetry as default,
  irsdkConstants as constants,
  Sample,
  readFileToBuffer,
  telemetryFileLoader
}
*/

// You might need to install and use a library like formidable to parse multipart/form-data
const fs = require('fs')
const formidable = require('formidable')

const { Telemetry } = require('./telemetry')

module.exports = async function (context, req) {
  try {
    // Parse the multipart/form-data request
    const formData = await new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm()

      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve(files)
      })
    })

    // Assume the file is uploaded with the key 'ibtFile'
    const uploadedFile = formData.ibtFile

    // Read the file content (this step depends on how formidable returns the file)
    const telemetryData = fs.readFileSync(uploadedFile.filepath)

    // Parse telemetry data
    const telemetry = new Telemetry(telemetryData)

    // Process the telemetry data as needed
    console.log(telemetry.header)

    // Send response
    context.res = {
      status: 200,
      body: 'Telemetry data processed.'
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error: ${error.message}`
    }
  }
}
