const { createLogger: _createLogger } = require("consolite");
const vscode = require("vscode");
const util = require('util');


/**
 * turn log data into a printable string.
 * @param {any} data
 * @returns {string}
 */
function data2string(data) {
  if (data instanceof Error) {
    return data.message || data.stack || util.inspect(data);
  }
  if (data.success === false && data.message) {
    return data.message;
  }
  if (data instanceof Array) {
    return data.map(data2string).join(" ");
  }
  return util.format(data);
}


/**
 * Creates Consolite instance to handle all logging
 * @param {string} name
 */
const createLogger = (name) => {
  const outputChannel = vscode.window.createOutputChannel("PyMakr", "log");
  const now = Date.now()

  const log = _createLogger(
    {
      methods: {
        debugShort: console.log,
        traceShort: console.log,
        //todo: add test to check writing to vscode output channel
        info: (...data) => {
          console.log("info: ", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine("info: " + data2string(data));
        },
        warn: (...data) => {
          console.warn("warning: ", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine("warning: " + data2string(data));
        },
        error: (...data) => {
          console.log("error: ", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine("error: " + data2string(data));
        },
        debug: (...data) => {
          console.log("debug: ", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine("debug: " + data2string(data));
        },
      },
    },
    ()=> `${name} (${Date.now() - now})`
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
