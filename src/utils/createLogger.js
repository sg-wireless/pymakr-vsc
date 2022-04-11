const { createLogger: _createLogger } = require("consolite");
const vscode = require("vscode");

/**
 * Creates Consolite instance to handle all logging
 * @param {string} name
 */
const createLogger = (name) => {
  const outputChannel = vscode.window.createOutputChannel("PyMakr");

  const log = _createLogger(
    {
      methods: {
        debugShort: console.log,
        traceShort: console.log,
        info: (...str) => {
          console.log("info: ", ...str); // in case we need a copy/paste of the console
          outputChannel.appendLine(str.join(" "));
        },
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

  return log;
};

module.exports = { createLogger };
