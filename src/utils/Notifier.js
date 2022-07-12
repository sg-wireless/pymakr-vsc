const vscode = require("vscode");

/**
 * @typedef {string} btnText selecting this option will not hide the notification in the future
 * @typedef {string} saveAsDefaultBtnTxt selecting this option will hide the notification in the future
 * @typedef {Object.<string, btnText|[btnText, saveAsDefaultBtnTxt]>} Options
 */

/**
 * The Notifier class handles notifications, warnings and errors sent to the user.
 * Use this.createNotification() for sending a notification.
 */
class Notifier {
  /** @param {PyMakr} pymakr */
  constructor(pymakr) {
    this.pymakr = pymakr;
    this.DONT_ASK_AGAIN = "No and don't ask again";
    this.DONT_SHOW_AGAIN = "Don't show again";
    this.messagers = {
      info: vscode.window.showInformationMessage,
      warning: vscode.window.showWarningMessage,
      error: vscode.window.showErrorMessage,
    };
  }

  /**
   * Creates VSCode notification, warning or error.
   * @example
   * createNotification(
   *   'warning', // info, warning or error
   *   'something happened', // the message
   *   // buttons, the key is the return value
   *   {
   *     optA: 'Use Option A',
   *     // to make an option persistable, use an array and provide the persisted value as the second entry
   *     optB: ['Use option B', 'Always use option B']
   *   }
   * )
   * @template {Options} Buttons
   * @param {'info'|'warning'|'error'} type
   * @param {string} message // the message shown to the user
   * @param  {Buttons=} options // map of {key: choice} or {key: [choice, persistent choice]}
   * @param {Boolean=} rememberable // if true, a subsequent notification will ask if the choice should be saved for future prompts
   * @param {string=} id // if not set, the notification message will be used
   * @returns {Promise<keyof Buttons>}
   */
  async createNotification(type, message, options, rememberable, id) {
    // Stale devices have question marks after stale values. We don't want these to cause duplicates
    id = id || message.replace(/\?/g, "");
    const storedValue = this.pymakr.config.get().get(`misc.notifications`)[id];
    const messager = this.messagers[type];

    const textToKeyMap = Object.entries(options).reduce((acc, [key, arr]) => {
      [arr].flat().forEach((val) => (acc[val] = key));
      return acc;
    }, {});

    // if we have a stored choice, return it - except for a DONT_ASK_AGAIN value
    if (storedValue && storedValue !== this.DONT_ASK_AGAIN) return textToKeyMap[storedValue];

    const choice = await messager(message, ...Object.values(options).flat().filter(Boolean));

    const result = textToKeyMap[choice];

    // store user's choice if wanted
    this.handlePersistables(id, options, choice, rememberable);

    return result;
  }

  /**
   * Handles persistable logic. If a choice is a persistable it will be saved.
   * If it is not persistable, but the prompt is rememberable and the user makes a selection the choice will be saved.
   * @param {string} id
   * @param {Options} options
   * @param {string} choice
   * @param {Boolean} rememberable
   */
  async handlePersistables(id, options, choice, rememberable) {
    // array of button texts whose values should be saved
    const persistables = Object.values(options)
      .map((text) => Array.isArray(text) && text[1])
      .filter(Boolean);

    const shouldStoreChoice = persistables.includes(choice) || (rememberable && (await this.askToStore(choice)));
    if (shouldStoreChoice === this.DONT_ASK_AGAIN) choice = this.DONT_ASK_AGAIN;
    if (shouldStoreChoice) {
      console.log("setting", `misc.notifications.${id}`, choice);
      const config = this.pymakr.config.get().get("misc.notifications");
      this.pymakr.config.get().update(`misc.notifications`, { ...config, [id]: choice });
    }
  }

  /**
   * Prompts user if they want their choice to be remembered
   * @param {string} choice
   */
  async askToStore(choice) {
    if (choice === undefined) return false;

    const options = {
      Yes: true,
      [this.DONT_ASK_AGAIN]: this.DONT_ASK_AGAIN,
    };

    const shouldSaveChoice = await vscode.window.showInformationMessage(
      `Do you wish to save your choice: "${choice}"`,
      ...Object.keys(options)
    );

    return options[shouldSaveChoice];
  }

  /**
   * All available notifications in Pymakr
   */
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
        { restart: "Restart in safe mode", [this.DONT_SHOW_AGAIN]: [null, this.DONT_SHOW_AGAIN] },
        true
      ),

    /** @param {Device} device */
    terminalAlreadyExists: (device) =>
      this.createNotification(
        "info",
        `A terminal for ${device.displayName} already exists.`,
        {
          sharedTerm: "Create new shared terminal",
          openExistingTerm: "Open existing terminal",
        },
        true
      ),

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
        "Could not safeboot device. Please hard reset the device and verify that a shield is installed.",
        { "": [null, this.DONT_SHOW_AGAIN] }
      ),

    devMode: () =>
      this.createNotification(
        "info",
        "In dev mode all file changes are instantly written to the device and the device is then rebooted.",
        { "": [null, this.DONT_SHOW_AGAIN] }
      ),
      
    uploadProject: () =>
      this.createNotification("info", "After uploading a project, you can start it by restarting the device.", {
        "": [null, this.DONT_SHOW_AGAIN],
      }),
  };
}

module.exports = { Notifier };
