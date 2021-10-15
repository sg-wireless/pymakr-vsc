const { createLogger } = require('consolite')

const log = createLogger('[PyMakr][serialport]')
log.level = process.env.PYMAKR_LOGLEVEL || 3

module.exports = { log }