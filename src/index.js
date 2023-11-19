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

    // console.log('Telemetry headers:', telemetry.headers)
    // console.log(telemetry.header)

    /**
    // Example: Create a summary or extract specific data from telemetry
    const telemetrySummary = {
      uniqueId: telemetry.uniqueId(),
      header: telemetry.header,
      sessionInfo: telemetry.sessionInfo,
      varHeaders: telemetry.varHeaders,
      telemetryData: telemetry.data
      // Add other telemetry properties or summaries here
    }
    */

    const telemetrySummary = {
      uniqueId: telemetry.uniqueId(),
      header: telemetry.headers, // Assuming this contains the parsed header data
      sessionInfo: telemetry.sessionInfo, // Contains the parsed YAML session info
      varHeaders: telemetry.varHeaders(), // Assuming this method returns the variable headers
      // Add a method to extract summarized telemetry data
      telemetryData: telemetry.getTelemetryDataSummary()
      // You can add more methods as needed to extract different parts of the telemetry data
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
