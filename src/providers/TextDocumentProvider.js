const { SerialPort } = require("serialport");
const vscode = require("vscode");
const { serializeKeyValuePairs } = require("../utils/misc");

/**
 * @implements {vscode.TextDocumentContentProvider}
 */
class TextDocumentProvider {
  /**
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;
  }

  provideTextDocumentContent(uri) {
    const doc = this.paths[uri.path];
    if(typeof doc === 'undefined') throw new Error('could not find pymakr document: ' + uri.toString())
    return doc()
  }

  paths = {
    'Pymakr: available devices': async () => {
      const devices = await SerialPort.list();
      const devicesStr = devices.map((e) => serializeKeyValuePairs(e)).join("\r\n\r\n");

      return devicesStr;
    },
  };
}

module.exports = { TextDocumentProvider };
