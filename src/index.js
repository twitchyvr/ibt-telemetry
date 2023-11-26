const Telemetry = require('./telemetry')

module.exports = async function (context, req) {
  try {
    if (!req.rawBody) {
      throw new Error('No file uploaded.')
    }

    const rawData = typeof req.rawBody === 'string' ? Buffer.from(req.rawBody, 'binary') : req.rawBody

    // Additional logging
    context.log('Type of rawData:', typeof rawData)
    context.log('Buffer size:', rawData.length)

<<<<<<< HEAD
    // Try to process telemetry
    try {
      const telemetry = await Telemetry.fromBuffer(rawData)
      const telemetrySummary = {
        uniqueId: telemetry.uniqueId(),
        header: telemetry.headers,
        sessionInfo: telemetry.sessionInfo,
        varHeaders: telemetry.varHeaders,
        diskHeaders: telemetry.diskHeaders,
        sampleCount: telemetry.sampleCount(),
        duration: telemetry.duration(),
        laps: telemetry.laps(),
        variables: telemetry.variables(),
        telemetry: telemetry.samples()
      }
=======
    // console.log('Telemetry headers:', telemetry.headers)
    // console.log(telemetry.header)
>>>>>>> parent of 9cac5f7 (multiple updates)

      context.res = {
        status: 200,
        body: telemetrySummary
      }
    } catch (telemetryError) {
      context.log.error('Error processing telemetry:', telemetryError)
      throw telemetryError // Rethrow to be caught by outer catch
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error: ${error.message} \r\nStack: ${error.stack}`
    }
    context.log.error('Function execution error:', error)
  }
}
