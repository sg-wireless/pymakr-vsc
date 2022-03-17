const vscode = require("vscode");
const { Project } = require("../Project.js");
const { ProjectDeviceTreeItem, ProjectTreeItem } = require("../providers/ProjectsProvider.js");
const { getNearestPymakrProjectDir } = require("./misc.js");

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
    devicePickerByProject: async (projectOrUri) => {
      if (!projectOrUri) throw new Error("projectOrUri can't be undefined");
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
