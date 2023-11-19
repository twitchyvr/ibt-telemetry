/**
 * iRacing ibt telemetry parser.

const Telemetry = require('./telemetry')
const Sample = require('./telemetry-sample')
const readFileToBuffer = require('./utils/read-file-to-buffer')
const telemetryFileLoader = require('./utils/telemetry-file-loader')
const irsdkConstants = require('./irsdk-constants')

module.exports = {
  Telemetry,
  Sample,
  readFileToBuffer,
  telemetryFileLoader,
  constants: irsdkConstants
}
*/

// You might need to install and use a library like formidable to parse multipart/form-data
const fs = require('fs')
const formidable = require('formidable')

const { Telemetry } = require('./telemetry')

module.exports = async function (context, req) {
  try {
    // Buffer the request body
    const requestBodyBuffer = Buffer.from(req.body)

    // Parse the request body using formidable
    const formData = await new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm()

      form.parse({ headers: req.headers, body: requestBodyBuffer }, (err, fields, files) => {
        if (err) reject(err)
        resolve({ fields, files })
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
