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
    "pymakr.newDevice": async () => {
      const { label: protocol } = await vscode.window.showQuickPick([
        {
          label: "telnet",
          description: "Network device",
        },
        {
          label: "serial",
          description: "USB device",
        },
      ]);

      const isTelnet = protocol === "telnet";

      const placeHolder = isTelnet ? "192.168.0.x" : process.platform === "win32" ? "COM3" : "/dev/tty-usbserial3";
      const prompt = protocol === "telnet" ? "Hostname or IP of your device" : "Path to your device";
      const address = await vscode.window.showInputBox({ placeHolder, prompt });

      const username = isTelnet
        ? await vscode.window.showInputBox({ prompt: "Username for your device [default: micro]", value: " micro" })
        : "";

      const password = isTelnet
        ? await vscode.window.showInputBox({ password: true, prompt: "Password for your device [default: python]", value: "python" })
        : "";

      const name = await vscode.window.showInputBox({
        value: `${protocol}://${address}`,
        prompt: "Name of your device",
      });

      this.pymakr.devicesStore.insert({ address, protocol, name, username, password });
    },
  };
}

module.exports = { Commands };
