'use babel';
const EventEmitter = require('events');
var fs = require('fs');
var vscode = require('vscode');
var ncp = require('copy-paste')
import Utils from './utils.js';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, workspace, extension} from 'vscode';
import Config from '../config.js';

export default class ApiWrapper {
  constructor() {
    this.default_config = Config.settings()
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
    console.log("Opening general settings")
    var config_file = Utils.getConfigPath("pymakr.json")
    console.log(config_file)
    if(config_file){
      fs.open(config_file,'r',function(err,contents){
          console.log("Opened config file")
          if(err){
            console.log("Doesn't exist yet... creating new")
            var json_string = _this.newSettingsJson(true) // first param to 'true' gets global settings
            console.log("Got the json content")
            fs.writeFile(config_file, json_string, function(err) {
              if(err){
                console.log("Failed to create file")
                cb(new Error(err))
                return
              }
              _this.watchConfigFile(config_file)
              console.log("Opening file in workspace")
              var uri = vscode.Uri.file(config_file)
              console.log(uri)
              vscode.workspace.openTextDocument(uri).then(function(textDoc){
                vscode.window.showTextDocument(textDoc)
                console.log("Opened")
                cb()
              })  
            })
          }else{
            console.log("Opening file in workspace")
            var uri = vscode.Uri.file(config_file)
            console.log(uri)
            vscode.workspace.openTextDocument(uri).then(function(textDoc){
              vscode.window.showTextDocument(textDoc)
              console.log("Opened")
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

  getOpenFile(cb,onerror){
    var editor = window.activeTextEditor;
    console.log("got editor")
    var doc = editor.document;
    var name = doc.fileName
    console.log(name)
    console.log(doc)
    console.log(doc.getText())
    cb(doc.getText(),name)
  }
}
