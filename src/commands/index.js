const { mkdirSync, readFileSync, writeFileSync } = require("fs");
const { writeFile } = require("fs").promises;
const vscode = require("vscode");
const { msgs } = require("../utils/msgs");
const {
  mapEnumsToQuickPick,
  getRelativeFromNearestParent,
  getRelativeFromNearestParentPosix,
} = require("../utils/misc");

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
      vscode.commands.registerCommand(key, async (...params) => {
        try {
          await value.bind(this)(...params);
        } catch (err) {
          vscode.window.showErrorMessage(
            `[Pymakr] Failed to run command: ${key}. Reason: ${
              err.message || err.name || err
            }. Please see logs for info.`
          );
          this.log.error(`Failed to run command: ${key} with params:`, params);
          this.log.error(err);
        }
      })
    );
    pymakr.context.subscriptions.push(...disposables);
  }

  commands = {
    /** provides pymakr to the callback - for testing purposes */
    "pymakr.getPymakr": (cb) => cb(this.pymakr),
    "pymakr.unhideDevice": async () => {
      const devices = this.pymakr.devicesStore.get().filter((device) => device.config.hidden);
      const picks = devices.map((device) => ({ label: device.name, description: device.id, device }));
      const picked = await vscode.window.showQuickPick(picks, { canPickMany: true, title: "Select devices to unhide" });

      if (picked && picked.length) {
        picked.forEach(({ device }) => {
          device.config.hidden = false;
          device.state.save();
        });
        this.pymakr.devicesProvider.refresh();
        this.pymakr.projectsProvider.refresh();
      }
    },
    /**
     * @param {DeviceTreeItem} treeItem
     */
    "pymakr.hideDevice": ({ device }) => {
      device.config.hidden = true;
      device.state.save();
      this.pymakr.devicesProvider.refresh();
      this.pymakr.projectsProvider.refresh();
    },
    /**
     * @param {DeviceTreeItem} treeItem
     */
    "pymakr.showTerminalLog": (treeItem) => {
      // @ts-ignore
      vscode.commands.executeCommand("vscode.open", vscode.Uri.file(treeItem.device.terminalLogFile.path));
    },

    /**
     * Creates a new Pymakr project in a folder
     * @param {vscode.Uri} uri
     */
    "pymakr.createProject": async (uri) => {
      const name = await vscode.window.showInputBox({
        title: "Project name",
        value: uri.path.split("/").pop(),
      });

      const project = {
        name,
        py_ignore: ["pymakr.conf", ".vscode", ".gitignore", ".git", "env", "venv"],
      };

      writeFileSync(uri.fsPath + "/pymakr.conf", JSON.stringify(project, null, 2));
    },
    /**
     * @param {DeviceTreeItem} treeItem
     */
    "pymakr.configureDevice": async (treeItem) => {
      const { device } = treeItem;
      const manifestConfig = device.pymakr.manifest.contributes.configuration.properties;

      let menu = "main";
      while (menu !== "_DONE_") {
        /**
         * @type {Object.<string, (config: DeviceConfig) => Promise<string>>}
         */
        const menus = {
          main: async (config) => {
            const result = await vscode.window.showQuickPick(
              [
                { label: "autoConnect", description: config.autoConnect },
                { label: "username", description: config.username || "" },
                { label: "password", description: config.password || "" },
              ],
              {}
            );
            return result?.label || "_DONE_";
          },
          autoConnect: async () => {
            const { enum: enums, enumDescriptions } = manifestConfig["pymakr.autoConnect"];

            const options = enums.map(mapEnumsToQuickPick(enumDescriptions));
            options.push({ label: "Use default", description: "Use defaults from VSCode settings", clear: true });

            let { label, clear } = await vscode.window.showQuickPick(options);
            if (clear) label = null;
            device.config.autoConnect = label;
            device.state.save();
            return "main";
          },
        };

        menu = await menus[menu](device.config);
      }
    },
    "pymakr.toggleAdvancedMode": async () => {
      const advancedMode = vscode.workspace.getConfiguration("pymakr").get("advancedMode");
      this.pymakr.config.get().update("advancedMode", !advancedMode);
    },
    "pymakr.runEditor": async () => {
      const editor = vscode.window.activeTextEditor;
      const text = editor.document.getText(editor.selection) || editor.document.getText();
      return this.commands["pymakr.runScript"](text);
    },
    /**
     * @param {string} text
     */
    "pymakr.runScript": async (text) => {
      /** @type {import("micropython-ctl-cont/dist-node/src/main").RunScriptOptions} */
      const options = {
        disableDedent: true,
        broadcastOutputAsTerminalData: true,
        runGcCollectBeforeCommand: true,
      };

      vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
        progress.report({ message: "Run script" });
        try {
          return await this.pymakr.activeDeviceStore.get().runScript(text, options);
        } catch (err) {
          console.log("er,", err.message);
          vscode.window.showErrorMessage("Could not run script. Reason: " + err);
        }
      });
    },
    /**
     * @param {vscode.Uri} uri
     */
    "pymakr.runFile": (uri) => {
      const text = readFileSync(uri.fsPath, "utf-8");
      return this.commands["pymakr.runScript"](text);
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.connect": ({ device }) => {
      device.connect();
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.disconnect": ({ device }) => {
      device.disconnect();
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.createTerminal": ({ device }) => {
      this.pymakr.terminalsStore.create(device);
    },

    "pymakr.newDeviceTelnet": async () => {
      const address = await vscode.window.showInputBox({
        placeHolder: "192.168.0.x",
        prompt: "Hostname or IP of your device",
      });
      const username = await vscode.window.showInputBox({
        prompt: "Username for your device [default: micro]",
        value: " micro",
      });
      const password = await vscode.window.showInputBox({
        password: true,
        prompt: "Password for your device [default: python]",
        value: "python",
      });
      const name = await vscode.window.showInputBox({
        value: `telnet://${address}`,
        prompt: "Name of your device",
      });
      const protocol = "telnet";
      this.pymakr.devicesStore.upsert({ address, protocol, name, username, password });
    },

    "pymakr.newDeviceSerial": async () => {
      const address = await vscode.window.showInputBox({
        placeHolder: process.platform === "win32" ? "COM3" : "/dev/tty-usbserial3",
        prompt: "Path to your device",
      });
      const name = await vscode.window.showInputBox({
        value: `serial://${address}`,
        prompt: "Name of your device",
      });
      const protocol = "serial";
      this.pymakr.devicesStore.upsert({ address, protocol, name });
    },

    "pymakr.newDeviceRecover": async () => {},

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
        {
          label: "Recover device",
          description: "Recover a previously hidden device",
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
      const workspaceFolders = vscode.workspace.workspaceFolders.map((f) => f.uri.fsPath);
      const selectedProject = await vscode.window.showQuickPick(
        this.pymakr.projectsStore.get().map((project) => ({
          label: project.name,
          description: getRelativeFromNearestParent(workspaceFolders)(project.folder),
          project,
        }))
      );
      if (selectedProject) this.pymakr.activeProjectStore.set(selectedProject.project);
    },

    "pymakr.setActiveDevice": async () => {
      const selectedDevice = await vscode.window.showQuickPick(
        this.pymakr.devicesStore.get().map((device) => ({
          label: device.name,
          device,
        }))
      );
      if (selectedDevice) this.pymakr.activeDeviceStore.set(selectedDevice.device);
    },

    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    "pymakr.uploadProject": ({ device, project }) => device.upload(project.folder, "/"),

    /**
     * @param {vscode.Uri} treeItem
     */
    "pymakr.upload": async ({ fsPath }) => {
      const projectFolders = this.pymakr.projectsStore.get().map((p) => p.folder);
      const relativePathFromProject = "/" + getRelativeFromNearestParentPosix(projectFolders)(fsPath);
      const { device } = await vscode.window.showQuickPick(
        this.pymakr.devicesStore.get().map((device) => ({ device, label: device.name }))
      );

      const destination = await vscode.window.showInputBox({
        title: "destination",
        value: relativePathFromProject,
      });

      if (device && destination) await device.upload(fsPath, destination);
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
    "pymakr.addDeviceToFileExplorer": async ({ device }) => {
      const uri = vscode.Uri.from({
        scheme: device.protocol,
        // vscode doesn't like "/" in the authority name
        authority: device.address.replaceAll("/", "%2F"),
        path: "/flash",
      });

      const name = `${device.protocol}:/${device.address}`;

      vscode.workspace.updateWorkspaceFolders(0, 0, { uri, name });
    },
  };
}

module.exports = { Commands };
