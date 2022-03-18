const { mkdirSync, readFileSync, writeFileSync } = require("fs");
const { writeFile } = require("fs").promises;
const vscode = require("vscode");
const { msgs } = require("../utils/msgs");
const { mapEnumsToQuickPick, getRelativeFromNearestParent } = require("../utils/misc");
const { relative } = require("path");
class Commands {
  /**
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;
    this.log = pymakr.log.createChild("command");
    const disposables = Object.entries(this.commands).map(([key, value]) =>
      vscode.commands.registerCommand(`pymakr.${key}`, async (...params) => {
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
    /**
     * @param {DeviceTreeItem} treeItem
     */
    resetDevice: async ({ device }) => {
      device.adapter.reset({ broadcastOutputAsTerminalData: true, softReset: false });
    },
    /**
     * @param {DeviceTreeItem} treeItem
     */
    softResetDevice: async ({ device }) => {
      console.log("soft reset");
      device.adapter.reset({ broadcastOutputAsTerminalData: true, softReset: true });
    },
    /**
     * @param {DeviceTreeItem} treeItem
     */
    eraseDevicePrompt: async ({ device }) => {
      const picks = [
        { label: "empty project", _path: "empty" },
        { label: "led example", _path: "led-example" },
      ];
      const picked = await vscode.window.showQuickPick(picks, { title: "How would you like to provision your device" });
      if (picked) return this.commands.eraseDevice({ device }, picked._path);
    },
    /**
     * @param {Partial<DeviceTreeItem>} treeItem
     */
    eraseDevice: async ({ device }, templateId) =>
      new Promise((resolve, reject) =>
        vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
          progress.report({ message: "Erasing device" });
          try {
            const templatePath = `${__dirname}/../../templates/${templateId}`;
            await device.adapter.remove("/flash", true);
            await device.upload(templatePath, "/");
            resolve();
          } catch (err) {
            console.log("er,", err.message);
            vscode.window.showErrorMessage("Could not erase device. Reason: " + err);
            reject(err);
          }
        })
      ),
    /** provides pymakr to the callback - for testing purposes */
    getPymakr: (cb) => cb(this.pymakr),
    unhideDevice: async () => {
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
    hideDevice: ({ device }) => {
      device.config.hidden = true;
      device.state.save();
      this.pymakr.devicesProvider.refresh();
      this.pymakr.projectsProvider.refresh();
    },
    /**
     * @param {DeviceTreeItem} treeItem
     */
    showTerminalLog: (treeItem) => {
      // @ts-ignore
      vscode.commands.executeCommand("vscode.open", vscode.Uri.file(treeItem.device.terminalLogFile.path));
    },

    createProjectPrompt: async () => {
      const folders = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: "Use this folder",
        title: "Create new Pymakr project",
        defaultUri: vscode.Uri.file(require("os").homedir()),
      });
      if (!folders) return;
      await this.commands.createProjectInFolderPrompt(folders[0], null, true);
    },

    /**
     * Creates a new Pymakr project in a folder
     * @param {vscode.Uri} uri
     * @param {any} fluff
     * @param {boolean} addToWorkspace
     */
    createProjectInFolderPrompt: async (uri, fluff, addToWorkspace) => {
      const baseFolder = uri.path.split("/").pop();
      const name = await vscode.window.showInputBox({
        title: "Project name",
        value: baseFolder,
      });

      // if the name doesn't match the folder, ask the user if they would like a subfolder
      if (name !== baseFolder) {
        const subFolder = name.replace(/[^A-Za-z0-9-]/g, "-");
        const newFolder = await vscode.window.showQuickPick(
          [{ label: baseFolder }, { label: `${baseFolder}/${subFolder}` }],
          { title: "Where would you like to create project?" }
        );
        if (!newFolder) return;
        if (newFolder.label !== baseFolder) uri = vscode.Uri.parse(`${uri.path}/${subFolder}`);
      }

      this.commands.createProject(uri, { name });

      // open pymakr.conf
      const document = await vscode.workspace.openTextDocument(uri.fsPath + "/pymakr.conf");
      await vscode.window.showTextDocument(document);

      if (addToWorkspace) {
        const wsPos = vscode.workspace.workspaceFolders.length || 0;
        await vscode.workspace.updateWorkspaceFolders(wsPos, 0, { uri });
      }

      // if project is already available, prompt for devices to use
      let project = this.pymakr.vscodeHelpers.coerceProject(uri);
      if (project) return this.commands.addDeviceToProjectPrompt(uri);
      // else wait for the projects store to update and prompt for devices to use
      else
        return new Promise((resolve) =>
          this.pymakr.projectsStore.next(() => resolve(this.commands.addDeviceToProjectPrompt(uri)))
        );
    },

    /**
     * @param {vscode.Uri} uri
     * @param {*} config
     */
    createProject: async (uri, config) => {
      const defaultConfig = {
        py_ignore: [".vscode", ".gitignore", ".git", "env", "venv"],
      };

      config = Object.assign(defaultConfig, config);

      // create pymakr.conf
      mkdirSync(uri.fsPath, { recursive: true });
      writeFileSync(uri.fsPath + "/pymakr.conf", JSON.stringify(config, null, 2));
    },

    /**
     * @param {DeviceTreeItem} treeItem
     */
    configureDevice: async (treeItem) => {
      const { device } = treeItem;
      const manifestConfig = device.pymakr.manifest.contributes.configuration.properties;

      let menu = "main";
      while (menu !== "_DONE_") {
        /**
         * @type {Object.<string, (config: import("../Device.js").DeviceConfig) => Promise<string>>}
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
    toggleAdvancedMode: async () => {
      const advancedMode = vscode.workspace.getConfiguration("pymakr").get("advancedMode");
      this.pymakr.config.get().update("advancedMode", !advancedMode);
    },
    runEditor: async () => {
      const editor = vscode.window.activeTextEditor;
      const text = editor.document.getText(editor.selection) || editor.document.getText();
      return this.commands.runScriptPrompt(text, editor.document.uri);
    },
    /**
     * @param {string} text
     * @param {vscode.Uri} uri
     */
    runScriptPrompt: async (text, uri) => {
      const devices = await this.pymakr.vscodeHelpers.devicePickerByProject(uri);
      await Promise.all(devices.map((device) => this.commands.runScript(text, device)));
    },
    /**
     * @param {string} text
     * @param {import("../Device.js").Device} device
     */
    runScript: async (text, device) => {
      /** @type {import("micropython-ctl-cont/dist-node/src/main").RunScriptOptions} */
      const options = {};

      vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
        progress.report({ message: `Run script on ${device.name}` });
        try {
          return await device.runScript(text, options);
        } catch (err) {
          console.log("er,", err.message);
          vscode.window.showErrorMessage("Could not run script. Reason: " + err);
        }
      });
    },
    /**
     * @param {vscode.Uri} uri
     */
    runFile: (uri) => {
      const text = readFileSync(uri.fsPath, "utf-8");
      return this.commands.runScriptPrompt(text, uri);
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    connect: ({ device }) => {
      device.connect();
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    disconnect: ({ device }) => {
      device.disconnect();
    },
    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    createTerminal: ({ device }) => {
      this.pymakr.terminalsStore.create(device);
    },

    newDeviceTelnet: async () => {
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

    newDeviceSerial: async () => {
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

    newDeviceRecover: async () => {},

    newDevice: async () => {
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

    setActiveProject: async () => {
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

    setActiveDevice: async () => {
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
    uploadProject: ({ device, project }) => device.upload(project.folder, "/"),

    /**
     * @param {vscode.Uri} uri
     */
    uploadPrompt: async (uri) => {
      const project = this.pymakr.vscodeHelpers.coerceProject(uri);
      const devices = await this.pymakr.vscodeHelpers.devicePickerByProject(project);

      const relativePathFromProject = relative(project.folder, uri.fsPath).replace(/\\+/, "/");
      const destination = await vscode.window.showInputBox({
        title: "destination",
        value: relativePathFromProject,
      });

      return Promise.all(devices.map((device) => this.commands.upload(uri, device, destination)));
    },

    /**
     * @param {vscode.Uri} uri
     * @param {import('../Device.js').Device} device
     * @param {string} destination not including /flash
     */
    upload: async ({ fsPath }, device, destination) => {
      try {
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
          progress.report({ message: `copying...}` });
          await device.upload(fsPath, destination);
        });
      } catch (err) {
        const errors = ["failed to upload", fsPath, "to", destination, "\r\nReason:", err];
        vscode.window.showErrorMessage(errors.join(" "));
        this.log.error(errors);
      }
    },

    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    downloadProject: async (treeItem) => {
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
     * @param {projectRef} treeItemOrProject
     */
    addDeviceToProjectPrompt: async (treeItemOrProject) => {
      const project = this.pymakr.vscodeHelpers.coerceProject(treeItemOrProject);
      const devices = this.pymakr.devicesStore.get();
      const picks = await vscode.window.showQuickPick(
        [
          ...devices
            .filter((_device) => !project.devices.includes(_device))
            .map((_device) => ({
              label: _device.name,
              device: _device,
            })),
        ],
        {
          title: `Which devices would you like to use with "${project.name}"`,
          canPickMany: true,
        }
      );
      if (picks) picks.map((pick) => project.addDevice(pick.device));
    },

    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    removeDeviceFromProject: async (treeItem) => {
      const { project, device } = treeItem;
      project.removeDevice(device);
    },

    /**
     * @param {ProjectDeviceTreeItem} treeItem
     */
    addDeviceToFileExplorer: async ({ device }) => {
      const uri = vscode.Uri.from({
        scheme: device.protocol,
        // vscode doesn't like "/" in the authority name
        authority: device.address.replace(/\//g, "%2F"),
        path: "/flash",
      });

      const name = `${device.protocol}:/${device.address}`;

      const wsPos = vscode.workspace.workspaceFolders.length || 0;
      vscode.workspace.updateWorkspaceFolders(wsPos, 0, { uri, name });
    },
  };
}

module.exports = { Commands };
