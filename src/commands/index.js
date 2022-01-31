const vscode = require("vscode");

class Commands {
  /**
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;
    const disposables = Object.entries(this.commands).map(([key, value]) =>
      vscode.commands.registerCommand(key, value.bind(this))
    );
    pymakr.context.subscriptions.push(...disposables);
  }

  commands = {
    "pymakr.connect": (treeItem) => {
      const device = this.pymakr.devicesStore.get().find((device) => device.id === treeItem.id);      
      this.pymakr.terminalsStore.create(device);
    },
  };
}

module.exports = { Commands };
