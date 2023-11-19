const formidable = require('formidable')
const util = require('util')
const fs = require('fs')
const { Telemetry } = require('./telemetry')

module.exports = async function (context, req) {
  try {
    // Convert formidable form parsing to a promise
    const form = new formidable.IncomingForm()
    const parse = util.promisify(form.parse).bind(form)

    // Parse the form
    const { fields, files } = await parse(req)

    // Get uploaded file
    const uploadedFile = files.ibtFile

    // Ensure file exists
    if (!uploadedFile) {
      throw new Error('No file uploaded.')
    }

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
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error: ${error.message}`
    }
  }
}
