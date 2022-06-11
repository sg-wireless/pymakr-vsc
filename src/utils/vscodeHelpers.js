const vscode = require("vscode");
const { Project } = require("../Project.js");
const { ProjectDeviceTreeItem, ProjectTreeItem } = require("../providers/ProjectsProvider.js");
const errors = require("./errors.js");
const { getNearestPymakrProjectDir } = require("./misc.js");



function pick(obj, ...props) {
  return props.reduce(function (result, prop) {
    result[prop] = obj[prop];
    return result;
  }, {});
}

function omit(obj, ...props) {
  const result = { ...obj };
  props.forEach(function (prop) {
    delete result[prop];
  });
  return result;
}

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
      const staleNote = device.stale ? "<span style='color:#ff0;'> _$(alert) Stale. Please connect to refresh. $(alert)_</span>\n\n" : "";
      const projectName = "" + device.state.pymakrConf.get().name || "unknown";

      const mdString = new vscode.MarkdownString("", true);
      mdString.supportHtml = true;
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
      if (device.info) mdString.appendMarkdown(helpers.objectToTable(omit(device.info, "nodename")).value);
      // append row to the prior table 
      if (device.config) mdString.appendMarkdown(`|**Root path**|${device.config.rootPath}|\n`);
      return mdString;
    },
  };
  return helpers;
};

module.exports = { createVSCodeHelpers };
