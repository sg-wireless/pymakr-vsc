const vscode = require("vscode");

/**
 * @typedef {string} btnText selecting this option will not hide the notification in the future
 * @typedef {string} saveAsDefaultBtnTxt selecting this option will hide the notification in the future
 */

class Notifier {
  /** @param {PyMakr} pymakr */
  constructor(pymakr) {
    this.pymakr = pymakr;
  }

  /**
   * @example
   * createNotification(
   *   'warning', // info, warning or error
   *   'something happened', // the message
   *   // buttons, the key is the return value
   *   {
   *     optA: 'Use Option A',
   *     // to make an option defaultable, use an array and provide the default as the second entry
   *     optB: ['Use option B', 'Always use option B']
   *   }
   * )
   * @template {Object.<string, btnText|[btnText, saveAsDefaultBtnTxt]>} Buttons
   * @param {'info'|'warning'|'error'} type
   * @param {string} message
   * @param  {Buttons=} options
   * @param {Boolean=} disableable
   * @param {string=} id
   * @returns {Promise<keyof Buttons|'disabled'>}
   */
  async createNotification(type, message, options, disableable, id) {
    id = id || message;
    const storedValue = this.pymakr.config.get().get(`notifications.${id}`);
    if (storedValue) return storedValue;

    const nativeOptions = disableable ? { disabled: [false, "Don't show again"] } : {};
    const allOptions = { ...options, ...nativeOptions };

    // array of button texts whose values should be saved
    const persistables = Object.values(allOptions)
      .map((text) => Array.isArray(text) && text[1])
      .filter(Boolean);

    const messagers = {
      info: vscode.window.showInformationMessage,
      warning: vscode.window.showWarningMessage,
      error: vscode.window.showErrorMessage,
    };

    const messager = messagers[type];
    const result = await messager(message, ...Object.values(allOptions).flat().filter(Boolean));

    if (persistables.includes(result)) console.log("should store this thing", result);

    const textToKeyMap = Object.entries(allOptions).reduce((acc, [key, arr]) => {
      [arr].flat().forEach(val => acc[val] = key)
      return acc;
    }, {});

    return textToKeyMap[result]
  }

  notifications = {
    showSharedTerminalInfo: () =>
      this.createNotification(
        "info",
        "When two terminals share a device, only the last used terminal will receive output from the device.",
        {},
        true
      ),

    /** @param {Device} device */
    restartInSafeMode: (device) =>
      this.createNotification(
        "info",
        `${device.displayName} seems to be busy. Do you wish restart it in safe mode?`,
        { restart: "Restart in safe mode" },
        true
      ),

    /** @param {Device} device */
    terminalAlreadyExists: (device) =>
      this.createNotification("info", `A terminal for ${device.displayName} already exists.`, {
        sharedTerm: ["Create new shared terminal", "Always create a shared terminal"],
        openExistingTerm: ["Open existing terminal", "Always Open existing terminal"],
      }),

    /** @param {Project} project */
    couldNotParsePymakrConfig: (project) =>
      this.createNotification("error", `Could not parse config: ${project.configFile.fsPath}`),

    /**
     * @param {string} command
     * @param {any} error
     */
    failedToRunCommand: (command, error) =>
      this.createNotification(
        "error",
        `[Pymakr] Failed to run command: ${command}. Reason: ${
          error.message || error.name || error
        }. Please see logs for info.`
      ),

    cantSafebootOfflineDevice: () => this.createNotification("error", "Cannot safeboot offline device."),

    couldNotEraseDevice: (error) => this.createNotification("error", `Could not erase device. Reason: ${error}`),

    couldNotRunScript: (error) => this.createNotification("error", `Could not run script. Reason: ${error}`),

    errors: (errors) => this.createNotification("error", errors.join(" ")),

    uncaughtError: (error) => this.createNotification("error", `Uncaught error: ${error.toString()}`),

    /** @param {Device} device */
    couldNotSafeboot: (device) =>
      this.createNotification(
        "warning",
        "Could not safeboot device. Please hard reset the device and verify that a shield is installed."
      ),
  };
}

module.exports = { Notifier };
