const vscode = require("vscode");
const { Project } = require("../Project.js");
const { ProjectDeviceTreeItem, ProjectTreeItem } = require("../providers/ProjectsProvider.js");

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
    },

    /**
     * Use coerceProject instead
     * @param {string} fsPath
     * @returns {Project}
     */
    _getProjectByFsPath: (fsPath) => pymakr.projectsStore.get().find((project) => project.folder === fsPath),

    /**
     * @param {vscode.Uri | import('../Project.js').Project} projectOrUri
     */
    devicePickerByProject: async (projectOrUri) => {
      const project = helpers.coerceProject(projectOrUri);

      const answers = await vscode.window.showQuickPick(
        pymakr.devicesStore.get().map((device) => ({
          label: device.name,
          picked: project.devices.includes(device),
          _device: device,
        })),
        { canPickMany: true }
      );
      return answers.map((a) => a._device);
    },
  };
  return helpers;
};

module.exports = { createVSCodeHelpers };
