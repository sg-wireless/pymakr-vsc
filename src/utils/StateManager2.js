// todo delete
// @deprecated

const vscode = require("vscode");

/**
 * @template R
 */
class StateManager2 {
  /**
   * State object that can be saved to VSCode's workspaceState
   * Uses callback to generate state object when save is called()
   * @param {PyMakr} pymakr
   * @param {string} section namespace of state/config object
   * @param {string} subSection id of state/config object
   * */
  constructor(pymakr, section = "pymakr", subSection) {
    /** @private */
    this.pymakr = pymakr;
    /** @private */
    this.log = pymakr.log.createChild("stateManager2");
    /** @private */
    this._context = pymakr.context;
    this.section = section;
    this.subSection = subSection;
  }

  /**
   * Fetches the state from the provided callback and saves it to VSCode's workspaceState
   * @param {*} value
   * @param {'workspaceState'|'globalState'|'workspaceConfig'|'workspaceFolderConfig'|'globalConfig'} location
   * @param {string=} field
   */
  save(value, location, field) {
    const fieldSuffix = field ? `.${field}` : "";
    const subsection = `${this.subSection}${fieldSuffix}`;
    const isGlobal = location === "globalConfig" || location === "globalState";
    const isConfig =
      location === "globalConfig" || location === "workspaceConfig" || location === "workspaceFolderConfig";
    if (isConfig) {
      const target = isGlobal
        ? vscode.ConfigurationTarget.Global
        : location === "workspaceConfig"
        ? vscode.ConfigurationTarget.Workspace
        : vscode.ConfigurationTarget.WorkspaceFolder;
      vscode.workspace.getConfiguration(this.section).update(subsection, value, target);
    } else {
      const section = `${this.section}.${this.subSection}${fieldSuffix}`;
      if (isGlobal) {
        this._context.globalState.update(section, value);
      } else {
        this._context.workspaceState.update(section, value);
      }
    }
    // this._context.
    this.log.debugShort("save", this.subSection, field, value);
    return this.load(field);
  }

  /**
   * Loads the state from VSCode's workspaceState
   * @param {string} field
   * @returns {R}
   */
  load(field) {
    const fieldSuffix = field ? `.${field}` : ``;
    const subSection = `${this.subSection}${fieldSuffix}`;

    const value = vscode.workspace.getConfiguration(this.section).get(subSection) || {};
    if (typeof value === "object")
      Object.assign(
        value,
        this._context.globalState.get(`${this.section}.${this.subSection}${fieldSuffix}`),
        this._context.workspaceState.get(`${this.section}.${this.subSection}${fieldSuffix}`)
      );

    this.log.debugShort("load", subSection, value);
    return value;
  }
}

module.exports = { StateManager2 };
