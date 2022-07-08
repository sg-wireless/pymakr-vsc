const vscode = require("vscode");

/** @implements {vscode.FileSystemProvider} */
class FileSystemProvider {
  /**
   *
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;
    this.log = pymakr.log.createChild("filesystemProvider");

    /** @private */
    this._emitter = new vscode.EventEmitter();
    this.onDidChangeFile = this._emitter.event;
  }

  createDirectory(uri) {
    const device = this._getDevice(uri);
    device.adapter.mkdir(uri.path);
  }

  async delete(uri) {
    const device = this._getDevice(uri);
    try {
      const { isDir } = await device.adapter.statPath(uri.path);
      return await device.adapter.remove(uri.path, isDir);
    } catch (err) {
      if (err.message.endsWith(" ENOENT")) throw vscode.FileSystemError.FileNotFound(`Could not find '${uri.path}'.`);
      else this.pymakr.notifier.notifications.uncaughtError(err)
    }
  }

  watch(uri, options) {
    // todo?
    return new vscode.Disposable(() => { });
  }

  async rename(oldUri, newUri) {
    const device = this._getDevice(oldUri);
    return device.adapter.rename(oldUri.path, newUri.path);
  }

  writeFile(uri, content) {
    const device = this._getDevice(uri);
    device.adapter.putFile(uri.path, content);
  }

  /**
   * @param {vscode.Uri} uri
   */
  async readFile(uri) {
    this.log.debug('read file', uri)
    const device = this._getDevice(uri);
    return device.adapter.getFile(uri.path);
  }

  /**
   * @private
   * @param {vscode.Uri} uri
   */
  _getDevice(uri) {
    const authority = uri.authority.replace(/%2F/g, "/");
    return this.pymakr.devicesStore.getByProtocolAndAddress(uri.scheme, authority);
  }

  /**
   * @param {vscode.Uri} uri
   * @returns {Promise<import("vscode").FileStat>}
   */
  async stat(uri) {
    const device = this._getDevice(uri);

    try {
      this.log.debug("stat file", uri);
      const stat = await device.adapter.statPath(uri.path);
      this.log.debug("stat for", uri.path, stat);

      if (!stat.exists) throw vscode.FileSystemError.FileNotFound(uri);
      return {
        ctime: Date.now(), //todo (fork or pr for micropython-ctl)
        mtime: Date.now(), //todo (fork or pr for micropython-ctl)
        size: stat.size,
        type: stat.isDir ? vscode.FileType.Directory : vscode.FileType.File,
      };
    } catch (err) {
      if (err.code === "FileNotFound") throw vscode.FileSystemError.FileNotFound(uri);
      else this.log.error("couldn't stat file:", uri.path, err);
    }
  }

  /**
   * @param {vscode.Uri} uri
   */
  async readDirectory(uri) {
    this.log.debug("read dir", uri.path);
    const device = this._getDevice(uri);
    const path = uri.path.startsWith(device.config.rootPath) ? uri.path : device.config.rootPath;

    try {
      const files = await device.adapter.listFiles(path, { recursive: false });
      this.log.debug(`found files in "${uri.path}"`, files);
      /** @type { [string, vscode.FileType][]} */
      const content = files.map((f) => [
        f.filename.replace(/^\/.+\//, ""), // get basename instead of absolute path
        f.isDir ? vscode.FileType.Directory : vscode.FileType.File,
      ]);

      return content;
    } catch (err) {
      this.log.error("couldn't read dir", path, err);
    }
  }
}

module.exports = { FileSystemProvider };
