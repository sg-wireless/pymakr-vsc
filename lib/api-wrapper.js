'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils.js');

var _utils2 = _interopRequireDefault(_utils);

var _vscode = require('vscode');

var _config = require('./config.js');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventEmitter = require('events');
var fs = require('fs');
var vscode = require('vscode');
var ncp = require('copy-paste');

var ApiWrapper = function () {
  function ApiWrapper() {
    _classCallCheck(this, ApiWrapper);

    this.config = _config2.default.settings();
  }

  _createClass(ApiWrapper, [{
    key: 'config',
    value: function config(key) {
      return this.config[key].default;
    }
  }, {
    key: 'openSettings',
    value: function openSettings(cb) {

      var _this = this;
      console.log("Opening general settings");
      var config_file = _utils2.default.getConfigPath("pymakr.json");
      console.log(config_file);
      if (config_file) {
        fs.open(config_file, 'r', function (err, contents) {
          console.log("Opened config file");
          if (err) {
            console.log("Doesn't exist yet... creating new");
            var json_string = _this.newSettingsJson(true); // first param to 'true' gets global settings
            console.log("Got the json content");
            fs.writeFile(config_file, json_string, function (err) {
              if (err) {
                console.log("Failed to create file");
                cb(new Error(err));
                return;
              }
              _this.watchConfigFile(config_file);
              console.log("Opening file in workspace");
              var uri = vscode.Uri.file(config_file);
              console.log(uri);
              vscode.workspace.openTextDocument(uri).then(function (textDoc) {
                vscode.window.showTextDocument(textDoc);
                console.log("Opened");
                cb();
              });
            });
          } else {
            console.log("Opening file in workspace");
            var uri = vscode.Uri.file(config_file);
            console.log(uri);
            vscode.workspace.openTextDocument(uri).then(function (textDoc) {
              vscode.window.showTextDocument(textDoc);
              console.log("Opened");
              cb();
            });
          }
        });
      } else {
        cb(new Error("No config file found"));
      }
    }
  }, {
    key: 'writeToCipboard',
    value: function writeToCipboard(text) {
      ncp.copy(text, function () {
        // completed
      });
    }
  }, {
    key: 'addBottomPanel',
    value: function addBottomPanel(options) {
      // not implemented
    }
  }, {
    key: 'getPackagePath',
    value: function getPackagePath() {
      var dir = __dirname.replace('/lib', '/');
      return dir;
    }
  }, {
    key: 'getPackageSrcPath',
    value: function getPackageSrcPath() {
      var dir = __dirname.replace('/lib', '/src/');
      return dir;
    }
  }, {
    key: 'clipboard',
    value: function clipboard() {
      // return atom.clipboard.read()
      return ncp.paste();
    }
  }, {
    key: 'writeClipboard',
    value: function writeClipboard(text) {
      // atom.clipboard.write(text)
    }
  }, {
    key: 'getProjectPaths',
    value: function getProjectPaths() {
      // console.log(extension.getExtension("test.test"))
      var folder = _vscode.workspace.rootPath;
      if (path != "") [];
      return [folder];
    }
  }, {
    key: 'getProjectPath',
    value: function getProjectPath() {
      // console.log(extension.getExtension("test.test"))
      var path = _vscode.workspace.rootPath;
      if (path != "") return path;
      return null;
    }
  }, {
    key: 'getCurrentFile',
    value: function getCurrentFile(cb, onerror) {
      var editor = _vscode.window.activeTextEditor;
      var doc = editor.document;
      var name = doc.fileName;
      cb(doc.getText(), name);
    }
  }]);

  return ApiWrapper;
}();

exports.default = ApiWrapper;