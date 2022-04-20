const { PyMakr } = require("./src/PyMakr");

/** @type {PyMakr} */
let pymakr;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {import('vscode').ExtensionContext} context
 */
async function activate(context) {
  pymakr = new PyMakr(context);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
