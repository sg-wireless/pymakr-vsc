/**
 * @template R
 */
class StateManager {
  /**
   * @param {PyMakr} pymakr
   * @param {string} id
   * @param {()=>R} cb
   * */
  constructor(pymakr, id, cb) {
    this.pymakr = pymakr;
    this.log = pymakr.log.createChild("stateManager");
    this._context = pymakr.context;
    this._cb = cb;
    this._id = `pymakr.${id}`;
  }

  /**
   * @returns {R}
   */
  save() {
    const value = this._cb();
    this._context.workspaceState.update(this._id, value);

    this.log.debugShort("save", this._id, value);
    return this.load();
  }

  /**
   * @returns {R}
   */
  load() {
    const value = this._context.workspaceState.get(this._id) || {};
    this.log.debugShort("load", this._id, value);
    return value;
  }
}

module.exports = { StateManager };
