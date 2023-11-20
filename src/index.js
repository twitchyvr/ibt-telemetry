const Telemetry = require('./telemetry')

module.exports = async function (context, req) {
  try {
    if (!req.rawBody) {
      throw new Error('No file uploaded.')
    }

    // Convert the raw body to a Buffer if it's a string
    const rawData = typeof req.rawBody === 'string' ? Buffer.from(req.rawBody, 'binary') : req.rawBody

    console.log('Type of rawData:', typeof rawData) // Log the type of rawData for debugging

    // Process telemetry with the converted buffer
    const telemetry = new Telemetry(rawData)

    if (telemetry.error) {
      // Handle error case
      context.res = {
        status: 400,
        body: telemetry.error
      }
      return
    }
    console.log('Telemetry headers:', telemetry.headers)
    console.log(telemetry.header)

    const telemetrySummary = {
      uniqueId: telemetry.uniqueId(),
      header: telemetry.headers, // Assuming this contains the parsed header data
      sessionInfo: telemetry.sessionInfo, // Contains the parsed YAML session info
      varHeaders: telemetry.varHeaders // Assuming this method returns the variable headers
      // Add a method to extract summarized telemetry data
      // telemetryData: telemetry.getTelemetryDataSummary()
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
