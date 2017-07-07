'use babel';
const EventEmitter = require('events');
var fs = require('fs');
var vscode = require('vscode');
var ncp = require('copy-paste')
import Utils from './utils.js';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, workspace, extension} from 'vscode';
import Config from '../config.js';

export default class ApiWrapper {
  constructor(settings) {
    this.default_config = Config.settings()
    this.settings = settings
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
    var config_file = Utils.getConfigPath("pymakr.json")
    if(config_file){
      fs.open(config_file,'r',function(err,contents){
          if(err){
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
      })
    }else{
      cb(new Error("No config file found"))
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
    var dir = __dirname.replace('/lib/main','/')
    return dir
  }

  getPackageSrcPath(){
    var dir = __dirname.replace('/lib/main','/src/')
    return dir
  }

  clipboard(){
    // no implmenetation needed, terminal supports it by default
  }

  writeClipboard(text){
    // no implmenetation needed, terminal supports it by default
  }

  getProjectPaths(){
    var folder = workspace.rootPath
    if(path != "") []
    return [folder] 
  }

  getProjectPath(){
    var path =  workspace.rootPath
    if(path != "") return path
    return null
  }

  getOpenFile(cb,onerror){
    var editor = window.activeTextEditor
    var doc = editor.document
    var name = doc.fileName
    cb(doc.getText(),name)
  }
}
