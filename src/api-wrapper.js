'use babel';
const EventEmitter = require('events');
var fs = require('fs');
var vscode = require('vscode');
var ncp = require('copy-paste')
import Utils from './utils.js';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, workspace, extension} from 'vscode';

export default class ApiWrapper {
  constructor() {
    this.configDefaults = {
      "address":"/dev/cu.usbserial-DQ0058DW",
      "username":"micro",
      "password":"python",
      "sync_folder":"",
      "sync_file_types":"py,txt,log,json,xml",
      "ctrl_c_on_connect":false,
      "open_on_start":true,
    }
    var _this = this
  }

  config(){
    // return atom.config
    var _this = this
    return {get: function(key){ return _this.configDefaults[key] }}
  }

  openSettings(){
    var settings = workspace.getConfiguration()
    if(!settings.has("pymakr")){
      console.log("Updating settings")
      console.log(settings.update("pymakr",{},true))
    }else{
      console.log("has settings:")
      console.log(settings.get("pymakr"))
    }
    console.log("settings:")
    console.log(settings)
    console.log('values:')
    console.log(values)

    var config_file = Utils.getConfigPath("pymakr.json");
    console.log('utils config file:')
    console.log(config_file)

    // atom.workspace.open("atom://config/packages/Pymakr")
  }

  writeToCipboard(text){
    ncp.copy(text,function(){
      // completed
    })
  }

  addBottomPanel(options){
    // atom.workspace.addBottomPanel(options)
  }

  getPackageSrcPath(){
    // console.log(vscode.extension.getExtension("test.test"))
    // console.log("Returning src path")
    var dir = __dirname.replace('/lib','/')
    return dir
    
    // return atom.packages.resolvePackagePath('Pymakr') + "/lib/"
  }

  clipboard(){
    // return atom.clipboard.read()
    return ncp.paste()
  }

  writeClipboard(text){
    // atom.clipboard.write(text)
  }

  getProjectPaths(){
    // console.log(extension.getExtension("test.test"))
    var folder = workspace.rootPath
    if(path != "") []
    return [folder] 
  }

  getProjectPath(){
    // console.log(extension.getExtension("test.test"))
    var path =  workspace.rootPath
    if(path != "") return path
    return null
  }

  getCurrentFile(cb,onerror){
    var editor = window.activeTextEditor;
    var doc = editor.document;
    var name = doc.fileName
    cb(doc.getText(),name)
  }
}
