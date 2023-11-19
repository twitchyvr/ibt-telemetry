const http = require('http')
const formidable = require('formidable')
const fs = require('fs')

const { Telemetry } = require('./telemetry')

module.exports = async function (context, req) {
  try {
    // Convert req to Node.js request
    const nodeReq = http.request(req)

    // Parse form with formidable
    const form = new formidable.IncomingForm()
    form.parse(nodeReq, (err, fields, files) => {
      // Handle error
      if (err) {
        throw new Error(err)
      }

      // Get uploaded file
      const uploadedFile = files.ibtFile

      // Read file
      const telemetryData = fs.readFileSync(uploadedFile.filepath)

      // Process telemetry
      const telemetry = new Telemetry(telemetryData)
      console.log(telemetry.header)

      // Response
      context.res = {
        status: 200,
        body: 'Telemetry data processed.'
      }
    })
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error: ${error.message}`
    }
  }
}
