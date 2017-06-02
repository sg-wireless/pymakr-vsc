'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _vscode = require('vscode');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventEmitter = require('events');
var fs = require('fs');
var vscode = require('vscode');
var ncp = require('copy-paste');

var ApiWrapper = function () {
  function ApiWrapper() {
    _classCallCheck(this, ApiWrapper);

    this.configDefaults = {
      "address": "/dev/cu.usbserial-DQ0058DW",
      "username": "micro",
      "password": "python",
      "sync_folder": "",
      "sync_file_types": "py,txt,log,json,xml",
      "ctrl_c_on_connect": false
    };
    var _this = this;
  }

  _createClass(ApiWrapper, [{
    key: 'config',
    value: function config() {
      // return atom.config
      var _this = this;
      return { get: function get(key) {
          return _this.configDefaults[key];
        } };
    }
  }, {
    key: 'openSettings',
    value: function openSettings() {
      var settings = _vscode.workspace.getConfiguration();
      var values = settings.get('configurations');
      console.log(settings);
      console.log(values);

      // atom.workspace.open("atom://config/packages/Pymakr")
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
      // atom.workspace.addBottomPanel(options)
    }
  }, {
    key: 'getPackageSrcPath',
    value: function getPackageSrcPath() {
      // console.log(vscode.extension.getExtension("test.test"))
      console.log("Returning src path");
      return "/Users/Ralph/github/test/test/src/";
      // return atom.packages.resolvePackagePath('Pymakr') + "/lib/"
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