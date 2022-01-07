const Config = require("../config.js");
const { createLogger } = require("consolite");

const logger = createLogger("pymakr");
logger.levels.critical = 2
logger.levels.warn = 3
logger.levels.info = 4
logger.levels.verbose = 5
logger.levels.silly = 6
logger.level = 3

class Logger {
  constructor(classname) {
    const loggerInstance = logger.createChild(classname);    
    loggerInstance.register('warning', console.warn)
    loggerInstance.register('silly', console.log)
    loggerInstance.register('verbose', console.log)
    return loggerInstance
  }
}

module.exports = Logger
