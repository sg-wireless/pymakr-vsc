const { createLogger: _createLogger } = require("consolite");

const createLogger = (name) => {
  /** @type {import('consolite').ConsoliteLogger & {debugShort?: function, traceShort?: function}}  */
  const log = _createLogger(name);
  log.debugShort = console.log;
  log.traceShort = console.log;
  log.levels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    log: 3,
    default: 3,
    debugShort: 4,
    debug: 5,
    traceShort: 6,
    trace: 7,
  };
  log.delimiter = ">";
  return log;
};

module.exports = { createLogger };
