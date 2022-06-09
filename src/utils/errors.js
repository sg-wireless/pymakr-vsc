class MissingProjectError extends Error {
  /**
   * @param {string=} message
   */
  constructor(message) {
    super(message || "Project not found");
    this.name = "MissingProjectError";
  }
}

class DeviceOfflineError extends Error {
  /**
   * @param {string=} message
   */
  constructor(message) {
    super(message || "cannot safeboot offline device");
    this.name = "DeviceOffline";
  }
}

module.exports = {
  MissingProjectError,
  DeviceOfflineError
};
