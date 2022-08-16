const { SerialPort } = require("serialport");
const vscode = require("vscode");
const { timestamp } = require("../utils/createLogger");
const { arraysToMarkdownTable, adapterHistoryTable } = require("../utils/formatters");
const { serializeKeyValuePairs } = require("../utils/misc");
const os = require("os");

/**
 * @typedef {Object} subProvider
 * @prop {string|RegExp} match
 * @prop {(...matches:string[]) => Promise<string>|string} body
 */

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
    const path = uri.path || uri;
    for (const subProvider of this.subProviders) {
      const matches = path.match(subProvider.match);
      if (matches) return subProvider.body(...matches);
    }

    throw new Error("could not find pymakr document: " + uri.toString());
  }

  onDidChangeEmitter = new vscode.EventEmitter();
  onDidChange = this.onDidChangeEmitter.event;

  /**
   * @type {subProvider[]}
   */
  subProviders = [
    {
      match: "available devices",
      body: async () => {
        const devices = await SerialPort.list();
        const devicesStr = devices.map((e) => serializeKeyValuePairs(e)).join("\r\n\r\n");
        return devicesStr;
      },
    },
    {
      match: /device summary - (.+)/,
      body: (_all, path) => {
        const GithubMaxLengthUri = 8170; //8182 to be exact
        const device = this.pymakr.devicesStore.get().find((device) => device.raw.path === path);
        const config = { ...device.config, password: "***", username: "***" };
        const configTable = arraysToMarkdownTable([["Config", ""], ...Object.entries(config || {})]);
        const deviceTable = arraysToMarkdownTable([["Device", ""], ...Object.entries(device.raw || {})]);
        const systemTable = arraysToMarkdownTable([["System", ""], ...Object.entries(device.info || {})]);
        const hostTable = arraysToMarkdownTable([
          ["Host", ""],
          ...Object.entries({
            OS: process.platform + " - " + os.arch(),
            Pymakr: vscode.extensions.getExtension("Pycom.pymakr")?.packageJSON.version,
            "Pymakr-Preview": vscode.extensions.getExtension("Pycom.pymakr-preview")?.packageJSON.version,
            VSCode: vscode.version,
          }),
        ]);

        const historyTable = arraysToMarkdownTable(adapterHistoryTable(device));
        const body = [
          configTable,
          deviceTable,
          systemTable,
          hostTable,
          `## Device History at ${timestamp(new Date())}`,
          historyTable,
        ].join("\r\n\r\n");

        const intro = encodeURI(
          "What I did: ***\n\nWhat I expected to happen: ***\n\nWhat actually happened: ***\n\nAdditional info: ***\n\n<!--Device info below. Please check for passwords or sensitive info.-->\n\n"
        );
        const truncateMsg = encodeURIComponent("\n\n\n#### History was truncated");
        let url = `https://github.com/pycom/pymakr-vsc/issues/new?body=${intro + encodeURIComponent(body)}`;
        if (url.length > GithubMaxLengthUri) url = url.slice(0, GithubMaxLengthUri - truncateMsg.length) + truncateMsg;

        const createIssueButton = [
          "# Create issue on Github",
          `### !WARNING ABOUT SENSITIVE DATA!`,
          `**Your device history may contain credentials or other sensitive data.**`,
          `After clicking the link below, please review the data before submitting it.`,
          `Pycom is not liable for credentials or other sensitive data posted to Github!`,
          `### [I understand - Create an issue on Github ](${url})`,
        ].join("\r\n\r\n");

        return [body, "# <br />", createIssueButton].join("\r\n\r\n");
      },
    },
  ];
}

module.exports = { TextDocumentProvider };
