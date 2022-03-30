const { Terminal } = require("../terminal/Terminal");
const { writable } = require("../utils/store");
const vscode = require("vscode");

/**
 * @param {PyMakr} pymakr
 */
const createTerminalsStore = (pymakr) => {
  /** @type {Writable<Terminal[]>} */
  const store = writable([]);

  /**
   * Creates a new terminal for the provided device
   * @param {Device} device
   */
  const create = (device) => store.update((terms) => [...terms, new Terminal(pymakr, device)]);
  /**
   * Removes the provided terminal
   * @param {Terminal} term 
   */
  const remove = (term) => store.update((terms) => terms.filter((_term) => _term !== term));

  const disposable = vscode.window.onDidCloseTerminal((term) => {
    store.update((terminals) => {
      const terminal = terminals.find((terminal) => terminal.term === term);
      return terminals.filter((_terminal) => _terminal !== terminal);
    });
  });
  pymakr.context.subscriptions.push(disposable);

  return { ...store, create, remove };
};

module.exports = { createTerminalsStore };
