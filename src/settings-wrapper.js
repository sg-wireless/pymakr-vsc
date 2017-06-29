'use babel';
const EventEmitter = require('events');
import ApiWrapper from './api-wrapper.js';
var fs = require('fs');
var vscode = require('vscode');
import Utils from './utils.js';
import {workspace} from 'vscode';

export default class SettingsWrapper extends EventEmitter {
  constructor() {
    super()
    this.global_config = {}
    this.project_config = {}
    this.api = new ApiWrapper()
    this.project_path = this.api.getProjectPath()
    this.config_file = this.project_path+"/pymakr.conf"
    this.json_valid = true
    this.address = this.api.config('address')
    this.username = this.api.config('username')
    this.password = this.api.config('password')
    this.sync_file_types = this.api.config('sync_file_typesaddress')
    this.sync_folder = this.api.config('sync_folder')
    this.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect')
    this.open_on_start = this.api.config('open_on_start')

    this.refresh()
    // this.refreshConfig()
    this.watchConfigFile()
    this.watchConfigFile(Utils.getConfigPath("pymakr.json"))
  }

  watchConfigFile(file){
    if(!file) file = this.config_file
    var _this = this
    fs.open(this.config_file,'r',function(err,content){
      if(!err){
        console.log("Watching config file")
        fs.watch(_this.config_file,null,function(err){
          _this.refresh()
        })
      }else{
        console.log(err)
      }
    })
  }

  refresh(){
    console.log("Refreshing config...")
    this.global_config = this.refreshConfig(Utils.getConfigPath("pymakr.json"))
    this.timeout = 15000
    this.project_config = this.refreshConfig(this.project_file)
  }

  refreshConfig(file){
    var _this = this
    var contents = null
    try{
      contents = fs.readFileSync(file,{encoding: 'utf-8'})
    }catch(Error){
      // file not found
      return null
    }
    var conf = {}
    if(contents){
      try{
        conf = JSON.parse(contents)
      }catch(SyntaxError){
        console.log("Syntax error in "+file)
        if(_this.json_valid){
          _this.json_valid = false
          _this.emit('format_error')
        }else{
          _this.json_valid = true
        }
      }
      _this.setConfig(conf)
      return conf
    }
  }

  setConfig(file){
    console.log("Setting config:")
    console.log(file)
    if('address' in file){
      this.address = file.address
    }
    if('username' in file){
      this.username = file.username
    }
    if('password' in file){
      this.password = file.password
    }
    if('sync_folder' in file){
      this.sync_folder = file.sync_folder
    }
    if('sync_file_types' in file){
      this.sync_file_types = file.sync_file_types
    }
    if('ctrl_c_on_connect' in file){
      this.ctrl_c_on_connect = file.ctrl_c_on_connect
    }
    if('open_on_start' in file){
      this.open_on_start = file.open_on_start
    }
    
    // this.global_config = this.refreshConfig(this.project_file)  
  }

  getDefaultConfig(global){
    var config = {
        "address": this.api.config('address'),
        "username": this.api.config('username'),
        "password": this.api.config('password'),
        "sync_folder": this.api.config('sync_folder'),
        "open_on_start": this.api.config('open_on_start')
    }
    if(global){
      config.sync_file_types = this.api.config('sync_file_types')
      config.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect')
    }
    return config
  }

  openProjectSettings(cb){
    var _this = this
    console.log("Opening project settings")
    if(this.project_path){
      console.log(this.project_path)
      var config_file = this.config_file
      console.log(config_file)
      fs.open(config_file,'r',function(err,contents){
          console.log("Opened config file")
          if(err){
            console.log("Doesn't exist yet... crating new")
            var json_string = _this.newSettingsJson()
            console.log("Got the json content")
            fs.writeFile(config_file, json_string, function(err) {
              if(err){
                console.log("Failed to create file")
                cb(new Error(err))
                return
              }
              _this.watchConfigFile()
              console.log("Opening file in workspace")
              var uri = vscode.Uri.file(config_file)
              console.log(uri)
              vscode.workspace.openTextDocument(uri).then(function(textDoc){
                console.log("Opened")
              })  
            })
          }else{
            console.log("Opening file in workspace")
            var uri = vscode.Uri.file(config_file)
            console.log(uri)
            vscode.workspace.openTextDocument(uri).then(function(textDoc){
              vscode.window.showTextDocument(textDoc)
              
            })
          }
          cb()
      })
    }else{
      cb(new Error("No project open"))
    }
  }

  newSettingsJson(global){
    var settings = this.getDefaultConfig(global)
    var json_string = JSON.stringify(settings,null,4)
    return json_string
  }
}
