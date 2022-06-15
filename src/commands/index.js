const { mkdirSync, readFileSync, writeFileSync } = require("fs");
const { writeFile } = require("fs").promises;
const vscode = require("vscode");
const { msgs } = require("../utils/msgs");
const {
  mapEnumsToQuickPick,
  getTemplates,
  copyTemplateByName,
  serializedEntriesToObj,
  objToSerializedEntries,
  waitFor,
} = require("../utils/misc");
const { relative } = require("path");
const { Project } = require("../Project");

/**
 * Commands contains all commands that can be accessed through VSCode.
 * If a command requires user input, create a separate command with a "Prompt" suffix to handle this.
 * @example
 * ```javascript
 * {
 *   createProject: ()=>{},
 *   createProjectPrompt: ()=>{},
 *   createProjectInFolderPrompt: ()=>{} //variation
 * }
 * ```
 */
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
    // todo link to this command from configuration's "Devices: Include" section
    listDevices: async () => {
      let uri = vscode.Uri.parse("pymakrDocument:" + "Pymakr: available devices");
      let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
      await vscode.window.showTextDocument(doc, { preview: false });
    },

    /**
     * Safe boots device. Starts device without running scripts
     * @param {{device: Device}} treeItem
     */
    safeBootDevice: async ({ device }) => {
      if (!device.adapter.__proxyMeta.target.isConnected())
        return vscode.window.showErrorMessage("Cannot safeboot offline device.");

      const timeout = 10000;
      vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
        progress.report({ message: "Safe booting" });
        const error = () => {
          const msg = "Could not safeboot device. Please hard reset the device and verify that a shield is installed.";
          device.log.warn(`Error for "${device.displayName}": ${msg}`);
          vscode.window.showWarningMessage(msg);
        };
        await waitFor(device.safeBoot(), timeout, error);
      });
    },

    /**
     * Reboot device
     * @param {DeviceTreeItem} treeItem
     */
    resetDevice: async ({ device }) => {
      // resetting the device should also reset the waiting calls
      device.adapter.__proxyMeta.reset();
      device.adapter.__proxyMeta.target.reset({ broadcastOutputAsTerminalData: true, softReset: false });
    },

    /**
     * Soft reboot device
     * @param {DeviceTreeItem} treeItem
     */
    softResetDevice: async ({ device }) => {
      device.adapter.reset({ broadcastOutputAsTerminalData: true, softReset: true });
    },

    /**
     * Erases device and prompts for choice of template
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
     * Erases device and applies specified template
     * @param {Partial<DeviceTreeItem>} treeItem
     */
    eraseDevice: async ({ device }, templateId) =>
      new Promise((resolve, reject) =>
        vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
          progress.report({ message: "Erasing device" });
          try {
            const templatePath = `${__dirname}/../../templates/${templateId}`;
            await device.adapter.remove(device.config.rootPath, true);
            await this.commands.upload({ fsPath: templatePath }, device, "/");
            resolve();
          } catch (err) {
            this.log.error(err);
            vscode.window.showErrorMessage("Could not erase device. Reason: " + err);
            reject(err);
          }
        })
      ),
    /**
     * provides pymakr to the callback - Required for accessing Pymakr from the test suite.
     **/
    getPymakr: (cb) => cb(this.pymakr),

    /**
     * Set visible status for devices
     */
    setVisibleDevices: async () => {
      const allDevices = this.pymakr.devicesStore.get();
      const picks = allDevices.map((device) => ({
        label: device.displayName,
        description: device.id,
        device,
        picked: !device.config.hidden,
      }));
      const picked = await vscode.window.showQuickPick(picks, { canPickMany: true, title: "Select devices to show" });
      const visibleDevices = picked.map((pick) => pick.device);

      allDevices.forEach((device) => (device.config = { ...device.config, hidden: !visibleDevices.includes(device) }));
      this.pymakr.refreshProvidersThrottled();
    },
    /**
     * Opens the log history
     * @param {DeviceTreeItem} treeItem
     */
    showTerminalHistory: (treeItem) => {
      // @ts-ignore
      vscode.commands.executeCommand("vscode.open", vscode.Uri.file(treeItem.device.terminalLogFile.path));
    },

    /**
     * Prompt where to create a project
     */
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
     * Creates a new Pymakr project in the specified folder
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

      await this.commands.projectCopyTemplatePrompt(uri);

      if (addToWorkspace) {
        const wsPos = vscode.workspace.workspaceFolders?.length || 0;
        await vscode.workspace.updateWorkspaceFolders(wsPos, 0, { uri });
      }

      // if project is already available, prompt for devices to use
      let project = this.pymakr.vscodeHelpers.coerceProject(uri);
      if (project) return this.commands.selectDevicesForProjectPrompt(uri);
      // else wait for the projects store to update and prompt for devices to use
      else
        return new Promise((resolve) =>
          this.pymakr.projectsStore.next(() => resolve(this.commands.selectDevicesForProjectPrompt(uri)))
        );
    },

    /**
     * Prompts user for a template or device to copy to a project folder
     * @param {vscode.Uri} projectUri
     */
    projectCopyTemplatePrompt: async (projectUri) => {
      const templateName = await vscode.window.showQuickPick(
        [
          ...getTemplates().map((t) => t.name),
          ...this.pymakr.devicesStore
            .get()
            .filter((d) => !d.busy.get() && d.connected)
            .map((d) => `import from device: ${d.name}`),
        ],
        { title: "Please select a template for your project" }
      );

      const match = templateName.match(/import from device: (.+)/);
      if (match) {
        const device = this.pymakr.devicesStore.get().find((d) => d.name === match[1]);
        const project = /** @type {Project} */ ({ folder: projectUri.fsPath });
        this.commands.downloadProject({ device, project });
      } else copyTemplateByName(templateName, projectUri.fsPath);
    },

    /**
     * Creates a new project
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
     * Menu for updating device configuration
     * @param {DeviceTreeItem} treeItem
     */
    configureDevice: async (treeItem) => {
      const { device } = treeItem;
      const manifestConfig = device.pymakr.manifest.contributes.configuration.find(
        (conf) => conf.title === "Devices"
      ).properties;

      let menu = "main";
      while (menu !== "_DONE_") {
        /**
         * @type {Object.<string, (config: import("../Device.js").DeviceConfig) => Promise<string>>}
         */
        const menus = {
          main: async (config) => {
            const result = await vscode.window.showQuickPick(
              [
                { label: "name", description: config.name || device.name },
                { label: "autoConnect", description: config.autoConnect },
                // todo are we adding telnet?
                // { label: "username", description: config.username || "" },
                // { label: "password", description: config.password || "" },
              ],
              {}
            );
            return result?.label || "_DONE_";
          },
          name: async () => {
            const name = await vscode.window.showInputBox({ placeHolder: device.name, value: device.config.name });
            device.config = { ...device.config, name };
            return "main";
          },
          autoConnect: async () => {
            const { enum: enums, enumDescriptions } = manifestConfig["pymakr.devices.autoConnect"];

            const options = enums.map(mapEnumsToQuickPick(enumDescriptions));
            options.push({ label: "Use default", description: "Use defaults from VSCode settings", clear: true });

            let { label, clear } = await vscode.window.showQuickPick(options);
            if (clear) label = null;
            device.config = { ...device.config, autoConnect: label };
            return "main";
          },
        };

        menu = await menus[menu](device.config);
      }
    },

    logState: () => {
      this.pymakr.log.info("[ PYMAKR STATE DUMP ]");
      this.pymakr.devicesStore.get().forEach((device) => {
        this.pymakr.log.info(
          device.name,
          "history",
          device.adapter.__proxyMeta.history.reduce(
            (last, next) =>
              (last += `  \r\n${next.field.toString()}(${next.args.map((v) => JSON.stringify(v)).join(", ")})`),
            ""
          )
        );

        this.pymakr.log.info(
          device.name,
          "queue",
          device.adapter.__proxyMeta.queue.reduce(
            (last, next) =>
              (last += `  \r\n${next.field.toString()}(${next.args.map((v) => JSON.stringify(v)).join(", ")})`),
            ""
          )
        );
      });
    },

    /**
     * Opens the selected project settins in the editor
     * @param {ProjectTreeItem} treeItem
     * @returns {Promise<any>}
     */
    configureProject: async (treeItem) => {
      if (!treeItem) {
        return;
      }
      const project = this.pymakr.vscodeHelpers.coerceProject(treeItem);
      const uri = vscode.Uri.file(project.folder + "/pymakr.conf");
      this.log.debug(`Revealing ${uri.fsPath} in explorer`);
      await vscode.commands.executeCommand("revealInExplorer", uri);
      await vscode.commands.executeCommand("vscode.open", uri);
    },

    /**
     * Runs the currently selected editor code on the device. If no code is selected, all code is ran.
     */
    runEditor: async () => {
      const editor = vscode.window.activeTextEditor;
      const text = editor.document.getText(editor.selection) || editor.document.getText();
      return this.commands.runScriptPrompt(text, editor.document.uri);
    },
    /**
     * Prompts what device(s) to execute a script on
     * @param {string} text
     * @param {vscode.Uri} uri
     */
    runScriptPrompt: async (text, uri) => {
      const devices = await this.pymakr.vscodeHelpers.devicePickerByProject(uri);
      await Promise.all(devices.map((device) => this.commands.runScript(text, device)));
    },
    /**
     * Runs a script on provided device
     * @param {string} text
     * @param {import("../Device.js").Device} device
     */
    runScript: async (text, device) => {
      /** @type {import("micropython-ctl-cont/dist-node/src/main").RunScriptOptions} */
      const options = {};

      vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
        progress.report({ message: `Run script on ${device.displayName}` });
        setTimeout(
          () => progress.report({ message: "Closing popup in 5s. Script will continue in background." }),
          5000
        );
        try {
          const scriptPromise = device.runScript(text, options);
          const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 10000));
          return Promise.race([scriptPromise, timeoutPromise]);
        } catch (err) {
          console.log("er,", err.message);
          vscode.window.showErrorMessage("Could not run script. Reason: " + err);
        }
      });
    },
    /**
     * Calls runScriptPrompt with with the content of the selected file
     * @param {vscode.Uri} uri
     */
    runFile: (uri) => {
      const text = readFileSync(uri.fsPath, "utf-8");
      return this.commands.runScriptPrompt(text, uri);
    },
    /**
     * Connects a device
     * @param {ProjectDeviceTreeItem} treeItem
     */
    connect: async ({ device }) => {
      await device.connect();
      setTimeout(() => this.commands.handleBusyDevice(device), 2000);
    },

    /**
     * @param {Device} device
     */
    handleBusyDevice: async (device) => {
      if (device.busy.get()) {
        const options = { restart: "Restart in safe mode" };
        const answer = await vscode.window.showInformationMessage(
          `${device.displayName} seems to be busy. Do you wish restart it in safe mode?`,
          options.restart
        );
        if (answer === options.restart) this.commands.safeBootDevice({ device });
      }
    },

    /**
     * Disconnects a device
     * @param {ProjectDeviceTreeItem} treeItem
     */
    disconnect: ({ device }) => {
      device.disconnect();
    },
    /**
     * Creates a new terminal. If a terminal already exists for the given device, prompt
     * the user if they want to to open a new shared terminal or the existing terminal
     * @param {ProjectDeviceTreeItem} treeItem
     */
    createTerminalPrompt: async ({ device }) => {
      const sharedTerm = "Create new shared terminal";
      const openExistingTerm = "Open existing terminal";

      const existingTerminal = this.pymakr.terminalsStore.get().find((t) => t.device === device);
      if (existingTerminal) {
        const answer = await vscode.window.showInformationMessage(
          `A terminal for ${device.displayName} already exists.`,
          sharedTerm,
          openExistingTerm
        );
        if (answer === sharedTerm) {
          this.pymakr.terminalsStore.create(device);
          this.pymakr.vscodeHelpers.showSharedTerminalInfo();
        } else existingTerminal.term.show();
      } else {
        this.pymakr.terminalsStore.create(device);
        this.commands.handleBusyDevice(device);
      }
    },

    /**
     * Not currently in supported
     */
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

    /**
     * Create a serial device manually
     */
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

    // todo remove
    newDeviceRecover: async () => {},

    /**
     * Uploads parent project to the device. Can only be accessed from devices in the projects view.
     * @param {ProjectDeviceTreeItem} treeItem
     */
    uploadProject: async ({ device, project }) => {
      await device.adapter.remove(device.config.rootPath, true);
      this.commands.upload({ fsPath: project.folder }, device, "/");
    },

    /**
     * Prompts for a device and destination for uploading a file or folder
     * @param {vscode.Uri} uri
     */
    uploadPrompt: async (uri) => {
      const project = this.pymakr.vscodeHelpers.coerceProject(uri);
      const devices = await this.pymakr.vscodeHelpers.devicePicker(project?.devices);

      const getRelativeFromProject = () => relative(project.folder, uri.fsPath).replace(/\\+/, "/");
      const getBasename = () => `/${uri.fsPath.replace(/.*[/\\]/g, "")}`;

      const relativePathFromProject = project ? getRelativeFromProject() : getBasename();

      const destination = await vscode.window.showInputBox({
        title: "destination",
        value: relativePathFromProject,
      });

      return Promise.all(devices.map((device) => this.commands.upload(uri, device, destination)));
    },

    /**
     * Uploads a file/folder to a connected device
     * @param {{fsPath: string}} uri the file/folder to upload
     * @param {import('../Device.js').Device} device
     * @param {string} destination not including the device.rootPath ( /flash or / )
     */
    upload: async ({ fsPath }, device, destination) => {
      const friendlySource = fsPath.replace(/.*[/\\]/g, "");
      if (!device.connected) await device.connect();
      try {
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
          progress.report({ message: `Uploading "${friendlySource}" to "${device.displayName}"...` });
          let filesAmount = 0;
          await device.upload(fsPath, destination, {
            onScanComplete: (files) => (filesAmount = files.length),
            onUpload: (file) =>
              progress.report({
                message: `Uploading "${file}" to "${device.displayName}"...`,
                increment: 100 / filesAmount,
              }),
          });
        });
      } catch (err) {
        const errors = ["failed to upload", fsPath, "to", destination, "\r\nReason:", err];
        vscode.window.showErrorMessage(errors.join(" "));
        this.log.error(errors);
      }
    },

    /**
     * Downloads content from a device to the parent project.
     * Command only accessible for devices in the projects view.
     * @param {Partial<ProjectDeviceTreeItem>} treeItem
     */
    downloadProject: async (treeItem) => {
      await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
        progress.report({ message: `Download from "${treeItem.device.displayName}"...` });
        const regex = new RegExp(`^${treeItem.device.config.rootPath}`);
        const SourceFilesAndDirs = await treeItem.device.adapter.listFiles("", { recursive: true });
        const filesAndDirs = SourceFilesAndDirs.map((fad) => ({
          ...fad,
          destination: treeItem.project.folder + fad.filename.replace(regex, ""),
        }));
        const files = filesAndDirs.filter((f) => !f.isDir);
        const dirs = filesAndDirs.filter((f) => f.isDir);

        this.log.debug(...msgs.download(filesAndDirs));

        dirs.forEach((dir) => mkdirSync(dir.destination, { recursive: true }));

        for (const file of files) {
          progress.report({
            message: `Downloading "${file.filename}" from "${treeItem.device.displayName}"...`,
            increment: 100 / files.length,
          });
          const contents = await treeItem.device.adapter.getFile(file.filename);
          writeFileSync(file.destination, contents)
        }
      });
    },

    /**
     * Prompts which devices to attach/detach from project
     * @param {projectRef} treeItemOrProject
     */
    selectDevicesForProjectPrompt: async (treeItemOrProject) => {
      const project = this.pymakr.vscodeHelpers.coerceProject(treeItemOrProject);
      const devices = this.pymakr.devicesStore.get();
      const picks =
        (await vscode.window.showQuickPick(
          [
            ...devices
              .filter((d) => !d.config.hidden)
              .map((_device) => ({
                label: _device.displayName,
                device: _device,
                picked: project.devices.includes(_device),
              })),
          ],
          {
            title: `Which devices would you like to use with "${project.name}"`,
            canPickMany: true,
          }
        )) || [];
      project.setDevices(picks.map((p) => p.device));
    },

    /**
     * Mounts a device to the file explorer view
     * @param {ProjectDeviceTreeItem} treeItem
     */
    addDeviceToFileExplorer: async ({ device }) => {
      // Todo: move to utlis
      const uri = vscode.Uri.from({
        scheme: device.protocol,
        // vscode doesn't like "/" in the authority name
        authority: device.address.replace(/\//g, "%2F"),
        path: device.config.rootPath,
      });

      const name = `${device.protocol}:/${device.address}`;

      const wsPos = vscode.workspace.workspaceFolders?.length || 0;

      if (wsPos <= 1) {
        const actions = this.pymakr.pendingActions.get();
        const msg = [
          "VSCode restarted because the primary workspace changed.",
          "VSCode restarted because workspaces were changed to multi.",
        ];
        actions.push({ target: ["vscode", "window", "showInformationMessage"], args: [msg[wsPos]] });
        actions.push({ target: ["vscode", "commands", "executeCommand"], args: ["revealInExplorer", uri] });
        this.pymakr.pendingActions.set(actions);
      }

      vscode.workspace.updateWorkspaceFolders(wsPos, 0, { uri, name });

      if (wsPos > 1) {
        vscode.commands.executeCommand("revealInExplorer", uri);
        return this.pymakr.vscodeHelpers.showAddDeviceToFileExplorerProgressBar();
      }
    },
  };
}

module.exports = { Commands };
