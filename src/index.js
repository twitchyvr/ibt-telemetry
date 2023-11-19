const Telemetry = require('./telemetry');

module.exports = async function (context, req) {
  try {
    // Check if there is content in the request body
    if (!req.rawBody) {
      throw new Error('No file uploaded.')
    }

    // The binary data of the .ibt file is contained in req.rawBody
    const telemetryData = req.rawBody

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
