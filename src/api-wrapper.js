'use babel';
const EventEmitter = require('events');
var fs = require('fs');
var vscode = require('vscode');
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, workspace} from 'vscode';

export default class ApiWrapper {
  constructor() {
    this.configDefaults = {
      "address":"/dev/cu.usbserial-DQ0058DW",
      "username":"micro",
      "password":"python",
      "sync_folder":"",
      "sync_file_types":"py,txt,log,json,xml",
      "ctrl_c_on_connect":false
    }
    var _this = this
  }

  config(){
    // return atom.config
    var _this = this
    return {get: function(key){ return _this.configDefaults[key] }}
  }

  openSettings(){
    // atom.workspace.open("atom://config/packages/Pymakr")
  }

  writeToCipboard(text){
    // atom.clipboard.write(text)
  }

  addBottomPanel(options){
    // atom.workspace.addBottomPanel(options)
  }

  getPackageSrcPath(){
    // return atom.packages.resolvePackagePath('Pymakr') + "/lib/"
  }

  clipboard(){
    // return atom.clipboard.read()
    return ""
  }

  writeClipboard(text){
    // atom.clipboard.write(text)
  }

  getProjectPaths(){
    console.log(workspace.textDocuments)
    return workspace.textDocuments
    // var project_paths = atom.project.getPaths()
    // if(project_paths.length > 0){
    //   return project_paths[0]
    // }
    // return null 
  }

  getProjectPath(){
    var project_paths = this.getProjectPaths()
    if(project_paths.length > 0){
      return project_paths[0]
    }
    
  }

  getCurrentFile(cb,onerror){
    var editor = window.activeTextEditor;
    var doc = editor.document;
    var name = doc.fileName
    cb(doc.getText(),name)
  }
}
