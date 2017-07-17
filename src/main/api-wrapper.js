'use babel';
const EventEmitter = require('events');
var fs = require('fs');
var vscode = require('vscode');
var ncp = require('copy-paste')
import Utils from '../helpers/utils.js';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, workspace, extension} from 'vscode';
import Config from '../config.js';

export default class ApiWrapper {
  constructor(settings) {
    this.default_config = Config.settings()
    this.settings = settings
    this.first_time_opening = false
    this.config_file = Utils.getConfigPath("pymakr.json")
    this.is_windows = process.platform == 'win32'
  }

  config(key){
    if(this.default_config[key]){
      return this.default_config[key].default
    }else{
      null
    }
  }

  openSettings(cb){
    if(!cb){
      cb = function(){}
    }
    var _this = this
    var config_file = this.config_file
    if(config_file){
      if(!this.settingsExist()){
          var json_string = _this.settings.newSettingsJson(true) // first param to 'true' gets global settings
          fs.writeFile(config_file, json_string, function(err) {
            if(err){
              cb(new Error(err))
              return
            }
            _this.settings.watchConfigFile(config_file)
            var uri = vscode.Uri.file(config_file)
            vscode.workspace.openTextDocument(uri).then(function(textDoc){
              vscode.window.showTextDocument(textDoc)
              cb()
            })  
          })
        }else{
          var uri = vscode.Uri.file(config_file)
          vscode.workspace.openTextDocument(uri).then(function(textDoc){
            vscode.window.showTextDocument(textDoc)
            cb()
          })
        }
    }else{
      cb(new Error("No config file found"))
    }
  }

  settingsExist(){
   
    if(this.config_file){
      try{
        fs.openSync(this.config_file,'r')
        return true
      }catch(e){
        return false
      }
      
    }
  }

  writeToCipboard(text){
    ncp.copy(text,function(){
      // completed
    })
  }

  addBottomPanel(options){
    // not implemented
  }

  getPackagePath(){
    if(this.is_windows){
      return Utils.normalize(__dirname).replace('/lib/main','/').replace(/\//g,'\\')
    }else{
      return __dirname.replace('/lib/main','/')
    }
  }

  getPackageSrcPath(){
    var dir = Utils.normalize(__dirname).replace('/lib/main','/src/')
    if(this.is_windows){
      dir = dir.replace(/\//g,'\\')
    }
    return dir
  }

  clipboard(){
    // no implmenetation needed, terminal supports it by default
  }

  writeClipboard(text){
    // no implmenetation needed, terminal supports it by default
  }

  getProjectPaths(){
    var path = this.rootPath()
    if(path == null) return []
    return [path] 
  }

  getProjectPath(){
    return this.rootPath()
  }

  rootPath(){
    var path =  workspace.rootPath
    if(path && path != "") {
      if(this.is_windows){
        path = path.replace(/\//g,'\\')
      }
      return path
    }
    return null
  }

  getOpenFile(cb,onerror){
    var editor = window.activeTextEditor
    var doc = editor.document
    var name = doc.fileName
    cb(doc.getText(),name)
  }
}
