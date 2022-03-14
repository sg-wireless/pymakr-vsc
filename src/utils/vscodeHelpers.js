const vscode = require("vscode");

/**
 * @param {pymakr} pymakr
 */
const createVSCodeHelpers = (pymakr) => {
  const helpers = {
    /**
     * @param {vscode.Uri | import('../Project.js').Project} projectOrUri
     */
    coerceProjectByUri: (projectOrUri) => {
      if (projectOrUri instanceof vscode.Uri) {
        const projects = pymakr.projectsStore.get();
        return projects.find((p) => projectOrUri.fsPath.startsWith(p.folder));
      } else return projectOrUri;
    },

    /**
     * @param {vscode.Uri | import('../Project.js').Project} projectOrUri
     */
    devicePickerByProject: async (projectOrUri) => {
      const project = helpers.coerceProjectByUri(projectOrUri);

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
