const { PyMakr } = require("./src/PyMakr");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {import('vscode').ExtensionContext} context
 */
async function activate(context) {
  new PyMakr(context);
}

// this method is called when your extension is deactivated
function deactivate() {
  //todo: close any open terminals to avoid them hanging when VScode is restarted at a later stage.
}

module.exports = {
  activate,
  deactivate,
};
