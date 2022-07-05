const path = require("path");
const vscode = require("vscode");
const { Project } = require("../Project.js");
const { ProjectDeviceTreeItem, ProjectTreeItem } = require("../providers/ProjectsProvider.js");
const errors = require("./errors.js");
const { getNearestPymakrProjectDir, omit } = require("./misc.js");

/**
 * @param {pymakr} pymakr
 */
const createVSCodeHelpers = (pymakr) => {
  const helpers = {
    /**
     * @param {vscode.TreeItem|vscode.Uri|string|Project} projectRef
     * @returns {Project}
     */
    coerceProject: (projectRef) => {
      if (projectRef instanceof Project) return projectRef;
      if (projectRef instanceof ProjectDeviceTreeItem) return projectRef.project;
      if (projectRef instanceof ProjectTreeItem) return projectRef.project;
      if (projectRef instanceof vscode.Uri) return helpers._getProjectByFsPath(projectRef.fsPath);
      if (typeof projectRef === "string") return helpers._getProjectByFsPath(projectRef);
      throw new Error("projectRef did not match an accepted type");
    },

    /**
     * Use coerceProject instead
     * @param {string} fsPath
     * @returns {Project}
     */
    _getProjectByFsPath: (fsPath) => {
      const projectPath = getNearestPymakrProjectDir(fsPath);
      return pymakr.projectsStore.get().find((project) => project.folder === projectPath);
    },

    /**
     * @param {vscode.Uri | import('../Project.js').Project} projectOrUri
     */
    devicesByProject: (projectOrUri) => {
      if (!projectOrUri) throw new errors.MissingProjectError();
      const project = helpers.coerceProject(projectOrUri);
      return project?.devices || [];
    },

    /**
     * @param {vscode.Uri | import('../Project.js').Project} projectOrUri
     */
    devicePickerByProject: (projectOrUri) => {
      return helpers.devicePicker(helpers.devicesByProject(projectOrUri));
    },

    /**
     * @param {Device[]} preselectedDevices
     */
    devicePicker: async (preselectedDevices = []) => {
      const answers = await vscode.window.showQuickPick(
        pymakr.devicesStore.get().map((device) => ({
          label: device.displayName,
          picked: preselectedDevices.includes(device),
          _device: device,
        })),
        { canPickMany: true }
      );
      return answers.map((a) => a._device);
    },

    showSharedTerminalInfo: async () => {
      if (pymakr.config.get().get("notifications.showSharedTerminalInfo")) {
        const dontShowAgain = await vscode.window.showInformationMessage(
          "When two terminals share a device, only the last used terminal will receive output from the device.",
          "Don't show again"
        );
        if (dontShowAgain) {
          pymakr.config.get().update("notifications.showSharedTerminalInfo", false, true);
        }
      }
    },
    showAddDeviceToFileExplorerProgressBar: () => {
      vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (token) => {
        token.report({ message: "Adding device to explorer..." });
      });
      return new Promise((resolve) => vscode.workspace.onDidChangeWorkspaceFolders(resolve));
    },

    /**
     * @param {Object} object
     * @returns
     */
    objectToTable: (object) => {
      const mdString = new vscode.MarkdownString();
      mdString.appendMarkdown("\n");
      mdString.appendMarkdown("|||");
      mdString.appendMarkdown("\n");
      mdString.appendMarkdown("|--|--|");
      mdString.appendMarkdown("\n");
      Object.keys(object).forEach((key) => mdString.appendMarkdown(`|**${key}**|${object[key]}|\n`));
      return mdString;
    },

    /**
     * Friendly summary of project, device and system
     * @param {Device} device
     * @returns
     */
    deviceSummary: (device) => {
      const staleNote = device.state.stale
        ? "<span style='color:#ff0;'> _$(alert) Stale. Please connect to refresh. $(alert)_</span>\n\n"
        : "";
      const projectName = "" + device.state.pymakrConf.get().name || "unknown";

      const _action = device.action.get()
      const getActionName = ()=> _action


      const mdString = new vscode.MarkdownString("", true);
      mdString.supportHtml = true;
      if(device.action.get())
      mdString.appendMarkdown(`<span style='color:#0f0;'>Running action: ${getActionName()}</span>\n\n`)
      mdString.appendMarkdown("### Project");
      mdString.appendMarkdown("\n");
      mdString.appendMarkdown(staleNote);
      mdString.appendMarkdown(helpers.objectToTable({ name: projectName }).value);
      mdString.appendMarkdown("\n\n");
      mdString.appendMarkdown("---");
      mdString.appendMarkdown("\n\n");
      mdString.appendMarkdown("### Device");
      mdString.appendMarkdown(helpers.objectToTable(omit(device.raw, "vendorId", "productId")).value);
      mdString.appendMarkdown("---");
      mdString.appendMarkdown("\n\n");
      mdString.appendMarkdown("### System");
      mdString.appendMarkdown("\n\n");
      mdString.appendMarkdown(staleNote);
      if (typeof device.info === "object") {
        const info = {
          ...omit(device.info, "nodename"),
          "Root path": device.config?.rootPath,
        };
        mdString.appendMarkdown(helpers.objectToTable(info).value);
      }
      // if info isn't available, show the error instead
      else if (typeof device.info === "string") mdString.appendMarkdown(device.info);
      return mdString;
    },

    /**
     * @param {Device} device
     */
    deviceStateIcon: (device) => {
      const icons = {
        offline: new vscode.ThemeIcon("debug-disconnect", { id: "disabledForeground" }),
        disconnected: {
          dark: path.join(__dirname + "..", "..", "..", "media", "dark", "lightning-muted.svg"),
          light: path.join(__dirname + "..", "..", "..", "media", "light", "lightning-muted.svg"),
        },
        idle: {
          dark: path.join(__dirname + "..", "..", "..", "media", "dark", "lightning.svg"),
          light: path.join(__dirname + "..", "..", "..", "media", "light", "lightning.svg"),
        },
        script: new vscode.ThemeIcon("github-action"), // or pulse
        action: new vscode.ThemeIcon("sync~spin"),
      };
      return icons[device.state.main.get()];
    },
  };
  return helpers;
};

module.exports = { createVSCodeHelpers };
