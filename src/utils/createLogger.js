const { createLogger: _createLogger } = require("consolite");
const vscode = require("vscode");
const util = require("util");

/** @param {Date} d  */
const timestamp = (d = new Date()) =>
  [d.getHours(), d.getMinutes(), d.getSeconds()].map((d) => d.toString().padStart(2, "0")).join(":") +
  `.${d.getMilliseconds().toString().padEnd(3, "0")}`;

/**
 * turn log data into a printable string.
 * @param {any} data
 * @returns {string}
 */
function data2string(data) {
  if (!data) return JSON.stringify(data);
  if (data instanceof Error) {
    return data.message || data.stack || util.inspect(data);
  }
  if (data.success === false && data.message) {
    return data.message;
  }
  if (data instanceof Array) {
    return data.map(data2string).join(" ");
  }
  // replace passwords in json with ****
  return util.format(data).replace(/password: '.*?'/g, "password: '****'");
}

/**
 * Creates Consolite instance to handle all logging
 * @param {string} name
 */
const createLogger = (name) => {
  const outputChannel = vscode.window.createOutputChannel("PyMakr", "log");
  // todo: add test to check writing to vscode output channel
  // todo: avoid logging passwords in the console log
  const log = _createLogger(
    {
      methods: {
        traceShort: console.log,
        info: (ts, ...data) => {
          console.log(ts, "info:", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine(ts + "info: " + data2string(data));
        },
        warn: (ts, ...data) => {
          console.warn(ts, "warning:", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine(ts + "warning: " + data2string(data));
        },
        error: (ts, ...data) => {
          console.log(ts, "error:", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine(ts + "error: " + data2string(data));
        },
        debugShort: (ts, ...data) => {
          console.log(ts, "debug:", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine(ts + "debug: " + data2string(data));
        },
        debug: (ts, ...data) => {
          console.log(ts, "debug:", ...data); // in case we need a copy/paste of the console
          outputChannel.appendLine(ts + "debug: " + data2string(data));
        },
      },
    },
    () => timestamp(),
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
