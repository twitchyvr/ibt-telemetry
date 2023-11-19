const Telemetry = require('./telemetry')

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

    console.log('Telemetry headers:', telemetry.headers)
    console.log(telemetry.header)

    // Example: Create a summary or extract specific data from telemetry
    const telemetrySummary = {
      uniqueId: telemetry.uniqueId(),
      header: telemetry.header,
      sessionInfo: telemetry.sessionInfo,
      varHeaders: telemetry.varHeaders,
      telemetryData: telemetry.data
      // Add other telemetry properties or summaries here
    }

    // Response
    context.res = {
      status: 200,
      body: telemetrySummary
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error: ${error.message}`
    }
  }
}
