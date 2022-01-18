const { Terminal } = require("../Terminal");
const { writable } = require("../utils/store");
const vscode = require("vscode");

/**
 * @param {PyMakr} pyMakr
 */
const createTerminalsStore = (pyMakr) => {
  /** @type {Writable<Terminal[]>} */
  const store = writable([]);

  const create = () => store.update((terms) => [...terms, new Terminal(pyMakr)]);
  const remove = (term) => store.update((terms) => terms.filter((_term) => _term !== term));

  const disposable = vscode.window.onDidCloseTerminal((term) => {
    store.update((terminals) => {
      const terminal = terminals.find((terminal) => terminal.term === term);
      terminal.status = "closed";
      terminal.stream.end();
      return terminals.filter((_terminal) => _terminal !== terminal);
    });
  });
  pyMakr.context.subscriptions.push(disposable);

  return { ...store, create, remove };
};

module.exports = { createTerminalsStore };
