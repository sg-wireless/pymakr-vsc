'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _apiWrapper = require('./api-wrapper.js');

var _apiWrapper2 = _interopRequireDefault(_apiWrapper);

var _utils = require('./utils.js');

var _utils2 = _interopRequireDefault(_utils);

var _vscode = require('vscode');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');

var fs = require('fs');
var vscode = require('vscode');

var SettingsWrapper = function (_EventEmitter) {
  _inherits(SettingsWrapper, _EventEmitter);

  function SettingsWrapper() {
    _classCallCheck(this, SettingsWrapper);

    var _this2 = _possibleConstructorReturn(this, (SettingsWrapper.__proto__ || Object.getPrototypeOf(SettingsWrapper)).call(this));

    _this2.global_config = {};
    _this2.project_config = {};
    _this2.api = new _apiWrapper2.default();
    _this2.project_path = _this2.api.getProjectPath();
    _this2.config_file = _this2.project_path + "/pymakr.conf";
    _this2.json_valid = true;
    _this2.address = _this2.api.config('address');
    _this2.username = _this2.api.config('username');
    _this2.password = _this2.api.config('password');
    _this2.sync_file_types = _this2.api.config('sync_file_typesaddress');
    _this2.sync_folder = _this2.api.config('sync_folder');
    _this2.ctrl_c_on_connect = _this2.api.config('ctrl_c_on_connect');
    _this2.open_on_start = _this2.api.config('open_on_start');

    _this2.refresh();
    // this.refreshConfig()
    _this2.watchConfigFile();
    _this2.watchConfigFile(_utils2.default.getConfigPath("pymakr.json"));
    return _this2;
  }

  _createClass(SettingsWrapper, [{
    key: 'watchConfigFile',
    value: function watchConfigFile(file) {
      if (!file) file = this.config_file;
      var _this = this;
      fs.open(this.config_file, 'r', function (err, content) {
        if (!err) {
          console.log("Watching config file");
          fs.watch(_this.config_file, null, function (err) {
            _this.refresh();
          });
        } else {
          console.log(err);
        }
      });
    }
  }, {
    key: 'refresh',
    value: function refresh() {
      console.log("Refreshing config...");
      this.global_config = this.refreshConfig(_utils2.default.getConfigPath("pymakr.json"));
      this.timeout = 15000;
      this.project_config = this.refreshConfig(this.project_file);
    }
  }, {
    key: 'refreshConfig',
    value: function refreshConfig(file) {
      var _this = this;
      var contents = null;
      try {
        contents = fs.readFileSync(file, { encoding: 'utf-8' });
      } catch (Error) {
        // file not found
        return null;
      }
      var conf = {};
      if (contents) {
        try {
          conf = JSON.parse(contents);
        } catch (SyntaxError) {
          console.log("Syntax error in " + file);
          if (_this.json_valid) {
            _this.json_valid = false;
            _this.emit('format_error');
          } else {
            _this.json_valid = true;
          }
        }
        _this.setConfig(conf);
        return conf;
      }
    }
  }, {
    key: 'setConfig',
    value: function setConfig(file) {
      console.log("Setting config:");
      console.log(file);
      if ('address' in file) {
        this.address = file.address;
      }
      if ('username' in file) {
        this.username = file.username;
      }
      if ('password' in file) {
        this.password = file.password;
      }
      if ('sync_folder' in file) {
        this.sync_folder = file.sync_folder;
      }
      if ('sync_file_types' in file) {
        this.sync_file_types = file.sync_file_types;
      }
      if ('ctrl_c_on_connect' in file) {
        this.ctrl_c_on_connect = file.ctrl_c_on_connect;
      }
      if ('open_on_start' in file) {
        this.open_on_start = file.open_on_start;
      }

      // this.global_config = this.refreshConfig(this.project_file)  
    }
  }, {
    key: 'getDefaultConfig',
    value: function getDefaultConfig(global) {
      var config = {
        "address": this.api.config('address'),
        "username": this.api.config('username'),
        "password": this.api.config('password'),
        "sync_folder": this.api.config('sync_folder'),
        "open_on_start": this.api.config('open_on_start')
      };
      if (global) {
        config.sync_file_types = this.api.config('sync_file_types');
        config.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect');
      }
      return config;
    }
  }, {
    key: 'openProjectSettings',
    value: function openProjectSettings(cb) {
      var _this = this;
      console.log("Opening project settings");
      if (this.project_path) {
        console.log(this.project_path);
        var config_file = this.config_file;
        console.log(config_file);
        fs.open(config_file, 'r', function (err, contents) {
          console.log("Opened config file");
          if (err) {
            console.log("Doesn't exist yet... crating new");
            var json_string = _this.newSettingsJson();
            console.log("Got the json content");
            fs.writeFile(config_file, json_string, function (err) {
              if (err) {
                console.log("Failed to create file");
                cb(new Error(err));
                return;
              }
              _this.watchConfigFile();
              console.log("Opening file in workspace");
              var uri = vscode.Uri.file(config_file);
              console.log(uri);
              vscode.workspace.openTextDocument(uri).then(function (textDoc) {
                console.log("Opened");
              });
            });
          } else {
            console.log("Opening file in workspace");
            var uri = vscode.Uri.file(config_file);
            console.log(uri);
            vscode.workspace.openTextDocument(uri).then(function (textDoc) {
              vscode.window.showTextDocument(textDoc);
            });
          }
          cb();
        });
      } else {
        cb(new Error("No project open"));
      }
    }
  }, {
    key: 'newSettingsJson',
    value: function newSettingsJson(global) {
      var settings = this.getDefaultConfig(global);
      var json_string = JSON.stringify(settings, null, 4);
      return json_string;
    }
  }]);

  return SettingsWrapper;
}(EventEmitter);

exports.default = SettingsWrapper;