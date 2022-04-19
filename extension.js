const { PyMakr } = require("./src/PyMakr");

/** @type {PyMakr} */
var thisExtension;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  thisExtension = new PyMakr(context);

}

// this method is called when your extension is deactivated
function deactivate() {
  //todo: close any open terminals to avoid them hanging when VScode is restarted at a later stage.
  thisExtension.terminalsStore.dispose();
  thisExtension.devicesStore.dispose();
  thisExtension.projectsStore.dispose();

}

module.exports = {
  activate,
  deactivate,
};
