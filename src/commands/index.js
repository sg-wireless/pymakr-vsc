const { mkdirSync, readdirSync, statSync, readFileSync } = require("fs");
const { writeFile } = require("fs").promises;
const vscode = require("vscode");
const { relative } = require("path");
const { msgs } = require("../utils/msgs");

/**
 * @typedef {import('../providers/ProjectsProvider').ProjectTreeItem} ProjectTreeItem
 * @typedef {import('../providers/DevicesProvider').DeviceTreeItem} DeviceTreeItem
 * @typedef {import('../providers/ProjectsProvider').ProjectDeviceTreeItem} ProjectDeviceTreeItem
 * @typedef {DeviceTreeItem | ProjectDeviceTreeItem} AnyDeviceTreeItem
 */

class Commands {
  /**
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;
    this.log = pymakr.log.createChild("command");
    const disposables = Object.entries(this.commands).map(([key, value]) =>
      vscode.commands.registerCommand(key, value.bind(this))
    );
    pymakr.context.subscriptions.push(...disposables);
  }

  commands = {
    "pymakr.runSelection": () => {
      console.log("not implemented yet");
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.connect": (treeItem) => {
      treeItem.device.connect();
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.disconnect": (treeItem) => {
      treeItem.device.disconnect();
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.createTerminal": (treeItem) => {
      this.pymakr.terminalsStore.create(treeItem.device);
    },

    "pymakr.newDevice": async () => {
      /** @type {{label: 'telnet'|'serial'}} */
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
        ? await vscode.window.showInputBox({
            password: true,
            prompt: "Password for your device [default: python]",
            value: "python",
          })
        : "";

      const name = await vscode.window.showInputBox({
        value: `${protocol}://${address}`,
        prompt: "Name of your device",
      });

      this.pymakr.devicesStore.upsert({ address, protocol, name, username, password });
    },

    "pymakr.setActiveProject": async () => {
      const findShortest = (a, b) => (a.length < b.length ? a : b);
      const workspaceFolders = vscode.workspace.workspaceFolders.map((f) => f.uri.fsPath);
      const selectedProject = await vscode.window.showQuickPick(
        this.pymakr.projectsStore.get().map((project) => ({
          label: project.name,
          description: workspaceFolders
            .map((path) => relative(path, project.folder))
            .reduce(findShortest)
            .replaceAll("\\", "/"),
          project,
        }))
      );
      this.pymakr.activeProjectStore.set(selectedProject.project);
    },

    "pymakr.setActiveDevice": async () => {
      const selectedDevice = await vscode.window.showQuickPick(
        this.pymakr.devicesStore.get().map((device) => ({
          label: device.name,
          device,
        }))
      );
      this.pymakr.activeDeviceStore.set(selectedDevice.device);
    },

    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.uploadProject": async (treeItem) => {
      const uploadFile = async (filename) => {
        this.log.debug("uploading", filename);
        const destination = "/flash/" + relative(treeItem.project.folder, filename);
        const data = Buffer.from(readFileSync(filename));
        await treeItem.device.adapter.putFile(destination, data, { checkIfSimilarBeforeUpload: true });
      };

      const processDir = async (dir) => {
        for (const file of readdirSync(dir)) {
          const filename = dir + "/" + file;
          if (statSync(filename).isFile()) await uploadFile(filename);
          else await processDir(filename);
        }
      };

      processDir(treeItem.project.folder);
    },

    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.downloadProject": async (treeItem) => {
      const SourceFilesAndDirs = await treeItem.device.adapter.listFiles("", { recursive: true });
      const filesAndDirs = SourceFilesAndDirs.map((fad) => ({
        ...fad,
        destination: treeItem.project.folder + fad.filename.replace(/^\/flash/, ""),
      }));
      const files = filesAndDirs.filter((f) => !f.isDir);
      const dirs = filesAndDirs.filter((f) => f.isDir);

      this.log.debug(...msgs.download(filesAndDirs));

      dirs.forEach((dir) => mkdirSync(dir.destination, { recursive: true }));

      const writePromises = [];
      for (const file of files) {
        const contents = await treeItem.device.adapter.getFile(file.filename);
        writePromises.push(writeFile(file.destination, contents));
      }
      await Promise.all(writePromises);
    },

    /**
     * @param {ProjectTreeItem} treeItem
     */
    "pymakr.addDeviceToProject": async (treeItem) => {
      const { project } = treeItem;
      const devices = this.pymakr.devicesStore.get();
      const pick = await vscode.window.showQuickPick([
        ...devices
          .filter((_device) => !project.devices.includes(_device))
          .map((_device) => ({
            label: _device.name,
            device: _device,
          })),
      ]);
      if (pick) project.addDevice(pick.device);
    },

    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.removeDeviceFromProject": async (treeItem) => {
      const { project, device } = treeItem;
      project.removeDevice(device);
    },

    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.addDeviceToFileExplorer": async (treeItem) => {
      const { device } = treeItem;
      vscode.workspace.updateWorkspaceFolders(0, 0, {
        uri: vscode.Uri.parse(`${device.protocol}://${device.address}/flash`),
        name: `${device.protocol}://${device.address}`,
      });
    },
  };
}

module.exports = { Commands };
