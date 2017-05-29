'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _apiWrapper = require('./api-wrapper.js');

var _apiWrapper2 = _interopRequireDefault(_apiWrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');

var fs = require('fs');

var SettingsWrapper = function (_EventEmitter) {
  _inherits(SettingsWrapper, _EventEmitter);

  function SettingsWrapper() {
    _classCallCheck(this, SettingsWrapper);

    var _this2 = _possibleConstructorReturn(this, (SettingsWrapper.__proto__ || Object.getPrototypeOf(SettingsWrapper)).call(this));

    _this2.project_path = null;
    _this2.project_config = {};
    _this2.api = new _apiWrapper2.default();
    var project_path = _this2.api.getProjectPath();
    _this2.config_file = _this2.project_path + "/pymakr.conf";
    _this2.json_valid = true;

    _this2.refresh();
    _this2.refreshProjectConfig();
    _this2.watchConfigFile();
    return _this2;
  }

  _createClass(SettingsWrapper, [{
    key: 'watchConfigFile',
    value: function watchConfigFile() {
      var _this = this;
      fs.open(this.config_file, 'r', function (err, content) {
        if (!err) {
          fs.watch(_this.config_file, null, function (err) {
            _this.refreshProjectConfig();
          });
        }
      });
    }
  }, {
    key: 'refresh',
    value: function refresh() {
      this.address = this.api.config().get('address');
      this.username = this.api.config().get('username');
      this.password = this.api.config().get('password');
      this.sync_folder = this.api.config().get('sync_folder');
      this.sync_file_types = this.api.config().get('sync_file_types');
      this.ctrl_c_on_connect = this.api.config().get('ctrl_c_on_connect');
      this.timeout = 15000;
      this.setProjectConfig();
    }
  }, {
    key: 'refreshProjectConfig',
    value: function refreshProjectConfig() {
      var _this = this;
      this.project_config = {};
      var contents = null;
      try {
        contents = fs.readFileSync(this.config_file, { encoding: 'utf-8' });
      } catch (Error) {
        // file not found
        return null;
      }

      if (contents) {
        try {
          var conf = JSON.parse(contents);
          _this.project_config = conf;
        } catch (SyntaxError) {
          if (_this.json_valid) {
            _this.json_valid = false;
            _this.emit('format_error');
          } else {
            _this.json_valid = true;
          }
        }
        _this.setProjectConfig();
      }
    }
  }, {
    key: 'setProjectConfig',
    value: function setProjectConfig() {
      if ('address' in this.project_config) {
        this.address = this.project_config.address;
      }
      if ('username' in this.project_config) {
        this.username = this.project_config.username;
      }
      if ('password' in this.project_config) {
        this.password = this.project_config.password;
      }
      if ('sync_folder' in this.project_config) {
        this.sync_folder = this.project_config.sync_folder;
      }
    }
  }, {
    key: 'getDefaultProjectConfig',
    value: function getDefaultProjectConfig() {
      return {
        "address": this.api.config.get('address'),
        "username": this.api.config.get('username'),
        "password": this.api.config.get('password'),
        "sync_folder": this.api.config.get('sync_folder')
      };
    }
  }, {
    key: 'openProjectSettings',
    value: function openProjectSettings(cb) {
      var _this = this;
      if (this.project_path) {
        var config_file = this.config_file;
        fs.open(config_file, 'r', function (err, contents) {
          if (err) {
            var json_string = _this.newProjectSettingsJson();
            fs.writeFile(config_file, json_string, function (err) {
              if (err) {
                cb(new Error(err));
                return;
              }
              _this.watchConfigFile();
              atom.workspace.open(config_file);
            });
          } else {
            atom.workspace.open(config_file);
          }
          cb();
        });
      } else {
        cb(new Error("No project open"));
      }
    }
  }, {
    key: 'newProjectSettingsJson',
    value: function newProjectSettingsJson() {
      var settings = this.getDefaultProjectConfig();
      var json_string = JSON.stringify(settings, null, 4);
      return json_string;
    }
  }]);

  return SettingsWrapper;
}(EventEmitter);

exports.default = SettingsWrapper;