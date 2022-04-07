const { createLogger: _createLogger } = require("consolite");
const vscode = require("vscode");

/**
 * Creates Consolite instance to handle all logging
 * @param {string} name 
 */
const createLogger = (name) => {
  //Create output channel
  let outputChannel = vscode.window.createOutputChannel("PyMakr")

  let outputLogLine = outputChannel.appendLine.bind(outputChannel)
  let outputLog = outputChannel.append.bind(outputChannel)

  // todo: remove before release as this distracts
  outputChannel.show()

  //Write to output.
  outputLogLine("This is a bound logger")
  outputLog("Part of a message:")
  outputLogLine(" the remainder of the message")
  const log = _createLogger(
    {
      methods: {
        debugShort: console.log,
        traceShort: console.log,
        info: outputLogLine, // todo this is not working
      },
    },
    name
  );


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

  log.info("Is this the bound logger ?? ") // todo this is not working either

  outputLogLine("This is a bound logger from outputLogLine")

  return log;
};

module.exports = { createLogger };
