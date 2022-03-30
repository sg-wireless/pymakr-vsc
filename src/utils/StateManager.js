/**
 * @template R
 */
class StateManager {
  /**
   * State object that can be saved to VSCode's workspaceState
   * Uses callback to generate state object when save is called()
   * @param {PyMakr} pymakr
   * @param {string} id namespace of state object
   * @param {()=>R} cb callback that fetches data to be saved whenever save() is called
   * */
  constructor(pymakr, id, cb) {
    /** @private */
    this.pymakr = pymakr;
    /** @private */
    this.log = pymakr.log.createChild("stateManager");
    /** @private */
    this._context = pymakr.context;
    /** @private */
    this._cb = cb;
    /** @private */
    this._id = `pymakr.${id}`;
  }

  /**
   * Fetches the state from the provided callback and saves it to VSCode's workspaceState
   * @returns {R}
   */
  save() {
    const value = this._cb();
    this._context.workspaceState.update(this._id, value);

    this.log.debugShort("save", this._id, value);
    return this.load();
  }

  /**
   * Loads the state from VSCode's workspaceState
   * @returns {R}
   */
  load() {
    const value = this._context.workspaceState.get(this._id) || {};
    this.log.debugShort("load", this._id, value);
    return value;
  }
}

module.exports = { StateManager };
