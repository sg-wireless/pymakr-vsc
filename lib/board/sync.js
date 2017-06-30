'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _monitor = require('./monitor.js');

var _monitor2 = _interopRequireDefault(_monitor);

var _config = require('../config.js');

var _config2 = _interopRequireDefault(_config);

var _logger = require('../helpers/logger.js');

var _logger2 = _interopRequireDefault(_logger);

var _apiWrapper = require('../main/api-wrapper.js');

var _apiWrapper2 = _interopRequireDefault(_apiWrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var crypto = require('crypto');

var fs = require('fs');

var Sync = function () {
  function Sync(pyboard, settings, terminal) {
    _classCallCheck(this, Sync);

    this.logger = new _logger2.default('Sync');
    this.api = new _apiWrapper2.default();
    this.settings = settings;
    this.pyboard = pyboard;
    this.terminal = terminal;
    this.total_file_size = 0;
    this.total_number_of_files = 0;
    this.number_of_changed_files = 0;
    this.config = _config2.default.constants();
    this.allowed_file_types = this.settings.sync_file_types;
    this.project_path = this.api.getProjectPath();
  }

  _createClass(Sync, [{
    key: 'isReady',
    value: function isReady() {

      // check if there is a project open
      if (!this.project_path) {
        return new error("No project open");
      }
      // check if project exists
      if (!this.exists(this.settings.sync_folder)) {
        return new error("Unable to find folder '" + folder_name + "'. Please add the correct folder in your settings");
      }

      return true;
    }
  }, {
    key: 'exists',
    value: function exists(dir) {
      return fs.existsSync(this.project_path + "/" + dir);
    }
  }, {
    key: 'progress',
    value: function progress(text, count) {
      if (this.progress_cb) {
        if (count) {
          this.progress_file_count += 1;
          text = "[" + this.progress_file_count + "/" + this.number_of_changed_files + "] " + text;
        }
        var _this = this;
        setTimeout(function () {
          _this.progress_cb(text);
        }, 0);
      }
    }
  }, {
    key: 'start',
    value: function start(oncomplete) {
      var _this = this;
      this.total_file_size = 0;
      this.total_number_of_files = 0;
      this.number_of_changed_files = 0;
      this.progress_file_count = 0;

      var sync_folder = this.settings.sync_folder;
      var folder_name = sync_folder == "" ? "main folder" : sync_folder;

      this.terminal.enter();

      var ready = this.isReady();
      if (ready instanceof Error) {
        this.terminal.write(ready.error + "\r\n");
        return;
      }

      // start sync
      this.terminal.write("Syncing project (" + folder_name + ")...\r\n");

      // called after sync is completed
      var cb = function cb(err) {
        if (err) {
          _this.terminal.writeln("Synchronizing failed: " + err.message + ". Please reboot your device manually.");
          _this.synchronizing = false;
          oncomplete();
        } else {
          _this.terminal.writeln("Synchronizing done, resetting board...");

          oncomplete();
        }
      };

      // called every time the sync starts writing a new file or folder
      var progress_cb = function progress_cb(text) {
        _this.terminal.writeln(text);
      };

      this.progress_cb = progress_cb;

      var dir = this.settings.sync_folder.replace(/^\/|\/$/g, ''); // remove first and last slash
      this.py_folder = this.project_path + "/" + dir + "/";
      var files = null;
      var file_hashes = null;
      try {
        files = this._getFiles(this.py_folder);
        file_hashes = this._getFilesHashed(files);
      } catch (e) {
        cb(new Error(e));
        return;
      }

      if (this.total_file_size > this.config.max_sync_size) {
        err = "Total size of " + this.total_number_of_files.toString() + " files too big (" + parseInt(this.total_file_size / 1000).toString() + "kb). Reduce the total filesize to < 350kb or select the correct sync folder in the settings";

        cb(new Error(err));
        return;
      }

      this.init(function (err) {
        if (err) {
          cb(err);
          _this.exit(function () {
            // do nothing, callback with error has already been called
          });
        } else {
          _this.progress("Reading file status");
          _this.logger.info('Reading pymakr file');
          _this.monitor.readFile('project.pymakr', function (err, content) {
            var jsonContent = [];
            try {
              jsonContent = JSON.parse(content);
            } catch (SyntaxError) {
              // No valid JSON file, writing all files
              _this.progress("Failed to read project status, synchronizing all files");
            }
            var changes = _this._getChangedFiles(file_hashes, jsonContent);

            var deletes = changes["delete"];
            var changed_files = changes["files"];
            var changed_folders = changes["folders"];

            _this.number_of_changed_files = changed_files.length;

            if (deletes.length > 0) {
              _this.progress("Deleting " + deletes.length.toString() + " files/folders");
            }

            if (deletes.length == 0 && changed_files.length == 0 && changed_folders.length == 0) {
              _this.progress("No files to synchronize");
              _this.complete(cb);
              return;
            } else {
              _this.logger.info('Removing files');
              _this.removeFilesRecursive(deletes, function () {
                _this.logger.info('Writing changed folders');
                _this.writeFilesRecursive(changed_folders, function (err) {
                  if (err) {
                    _this.throwError(cb, err);
                    return;
                  }

                  _this.logger.info('Writing changed files');
                  _this.writeFilesRecursive(changed_files, function (err) {
                    if (err) {
                      _this.throwError(cb, err);
                      return;
                    }
                    setTimeout(function () {
                      _this.logger.info('Writing project file');
                      _this.monitor.writeFile('project.pymakr', JSON.stringify(file_hashes), function (err) {
                        if (err) {
                          _this.throwError(cb, err);
                          return;
                        }
                        _this.logger.info('Exiting...');
                        _this.exit(function () {
                          _this.complete(cb);
                        });
                      });
                    }, 300);
                  });
                });
              });
            }
          });
        }
      });
    }
  }, {
    key: 'throwError',
    value: function throwError(cb, err) {
      var _this = this;
      var mssg = err ? err : new Error("Write failed");
      cb(mssg);

      if (_this.pyboard.type != 'serial') {
        _this.connect();
      }
      _this.pyboard.stopWaitingForSilent();

      var _this = this;
      this.exit(function () {
        _this.pyboard.enter_friendly_repl_non_blocking(function () {
          // do nothing, this might work or not based on what went wrong when synchronizing.
        });
      });
    }
  }, {
    key: 'complete',
    value: function complete(cb) {
      var _this = this;
      this.exit(function () {
        cb();
      });
    }
  }, {
    key: 'removeFilesRecursive',
    value: function removeFilesRecursive(files, cb, depth) {
      var _this = this;
      if (!depth) {
        depth = 0;
      }
      if (files.length == 0 || depth > 60) {
        cb();
      } else {
        var file = files[0];
        var filename = file[0];
        var type = file[1];
        if (type == "d") {
          _this.progress("Removing " + filename);
          _this.monitor.removeDir(filename, function () {
            files.splice(0, 1);
            _this.removeFilesRecursive(files, cb, depth + 1);
          });
        } else {
          _this.progress("Removing " + filename);
          _this.monitor.removeFile(filename, function () {
            files.splice(0, 1);
            _this.removeFilesRecursive(files, cb, depth + 1);
          });
        }
      }
    }
  }, {
    key: 'writeFilesRecursive',
    value: function writeFilesRecursive(files, cb, depth) {
      if (!depth) {
        depth = 0;
      }
      if (files.length == 0 || depth > 60) {
        cb();
      } else {
        var file = files[0];
        var filename = file[0];
        var type = file[1];
        var _this = this;
        if (type == "f") {
          var contents = fs.readFileSync(this.py_folder + filename, 'utf8');
          _this.progress("Writing file " + filename, true);
          _this.monitor.writeFile(filename, contents, function (err) {
            if (err) {

              cb(err);
              return;
            }
            _this.pyboard.flush(function () {
              files.splice(0, 1);
              _this.writeFilesRecursive(files, cb, depth + 1);
            });
          });
        } else {
          _this.progress("Creating dir " + filename);
          _this.monitor.createDir(filename, function () {
            _this.pyboard.flush(function () {
              files.splice(0, 1);
              _this.writeFilesRecursive(files, cb, depth + 1);
            });
          });
        }
      }
    }
  }, {
    key: 'init',
    value: function init(cb) {
      var _this = this;
      this.monitor = new _monitor2.default(this.pyboard, cb);
    }
  }, {
    key: '_getFiles',
    value: function _getFiles(dir) {
      return fs.readdirSync(dir);
    }
  }, {
    key: '_getFilesHashed',
    value: function _getFilesHashed(files, path) {
      if (!path) {
        path = "";
      }
      var file_hashes = [];
      var allowed_file_types = this.allowed_file_types.split(',');
      for (var i = 0; i < allowed_file_types.length; i++) {
        allowed_file_types[i] = allowed_file_types[i].trim();
      }

      for (var i = 0; i < files.length; i++) {
        var filename = path + files[i];
        if (filename.length > 0 && filename.substring(0, 1) != "." && files[i].substring(0, 1) != "." && files[i].length > 0) {
          var file_path = this.py_folder + filename;
          var stats = fs.lstatSync(file_path);
          if (stats.isDirectory()) {
            var files_from_folder = this._getFiles(file_path);
            if (files_from_folder.length > 0) {
              var hash = crypto.createHash('sha256').update(filename).digest('hex');
              file_hashes.push([filename, "d", hash]);
              file_hashes = file_hashes.concat(this._getFilesHashed(files_from_folder, filename + "/"));
            }
          } else if (allowed_file_types.indexOf(filename.split('.').pop()) > -1) {
            this.total_file_size += stats.size;
            this.total_number_of_files += 1;
            var contents = fs.readFileSync(file_path, 'utf8');
            var hash = crypto.createHash('sha256').update(contents).digest('hex');
            file_hashes.push([filename, "f", hash]);
          }
        }
      }
      return file_hashes;
    }
  }, {
    key: '_getChangedFiles',
    value: function _getChangedFiles(hashes, board_hashes) {
      var changed_files = [];
      var changed_folders = [];
      var deletes = [];
      for (var i = 0; i < hashes.length; i++) {
        var h = hashes[i];
        var found = false;
        for (var j = 0; j < board_hashes.length; j++) {
          var bh = board_hashes[j];
          if (h[0] == bh[0]) {
            if (h[2] != bh[2]) {
              if (h[1] == "f") {
                changed_files.push(h);
              } else {
                changed_folders.push(h);
              }
            }
            found = true;
            board_hashes.splice(j, 1);
            break;
          }
        }
        if (!found) {
          if (h[1] == "f") {
            changed_files.push(h);
          } else {
            changed_folders.push(h);
          }
        }
      }
      for (var i = 0; i < board_hashes.length; i++) {
        deletes.push(board_hashes[i]);
      }
      return { 'delete': deletes, 'files': changed_files, 'folders': changed_folders };
    }
  }, {
    key: 'exit',
    value: function exit(cb) {
      var _this = this;
      this.monitor.exit(cb);
    }
  }]);

  return Sync;
}();

exports.default = Sync;