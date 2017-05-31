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
      // atom.workspace.open("atom://config/packages/Pymakr")
    }
  }, {
    key: 'writeToCipboard',
    value: function writeToCipboard(text) {
      // atom.clipboard.write(text)
    }
  }, {
    key: 'addBottomPanel',
    value: function addBottomPanel(options) {
      // atom.workspace.addBottomPanel(options)
    }
  }, {
    key: 'getPackageSrcPath',
    value: function getPackageSrcPath() {
      console.log("Returning src path");
      return "/Users/Ralph/github/test/test/src/";
      // return atom.packages.resolvePackagePath('Pymakr') + "/lib/"
    }
  }, {
    key: 'clipboard',
    value: function clipboard() {
      // return atom.clipboard.read()
      return "";
    }
  }, {
    key: 'writeClipboard',
    value: function writeClipboard(text) {
      // atom.clipboard.write(text)
    }
  }, {
    key: 'getProjectPaths',
    value: function getProjectPaths() {
      // console.log(workspace.textDocuments)
      // return workspace.textDocuments
      // var project_paths = atom.project.getPaths()
      // if(project_paths.length > 0){
      //   return project_paths[0]
      // }
      return ["/Users/Ralph/Projects/PymakrAtomTest/"];
    }
  }, {
    key: 'getProjectPath',
    value: function getProjectPath() {
      var project_paths = this.getProjectPaths();
      if (project_paths.length > 0) {
        console.log(project_paths[0]);
        return project_paths[0];
      }
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