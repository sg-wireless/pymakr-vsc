'use babel';
const EventEmitter = require('events');
import ApiWrapper from './api-wrapper.js';
import Logger from '../helpers/logger.js'
var fs = require('fs');
var vscode = require('vscode');
import Utils from '../helpers/utils.js';
import {workspace} from 'vscode';


export default class SettingsWrapper extends EventEmitter {
  constructor() {
    super()
    this.global_config = {}
    this.project_config = {}
    this.api = new ApiWrapper()
    this.logger = new Logger('SettingsWraper')
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
    this.statusbar_buttons = this.api.config('statusbar_buttons')
    


    this.refresh()
    // this.refreshConfig()
    this.watchConfigFile()
    this.watchConfigFile(Utils.getConfigPath("pymakr.json"))
  }

  watchConfigFile(file){
    if(!file) file = this.config_file
    var _this = this
    this.logger.silly("Watching config file "+file)
    fs.open(file,'r',function(err,content){
      _this.logger.silly("Opened... ")
      if(!err){
        fs.watch(file,null,function(err){
          _this.logger.silly(file+" changed, refreshing")
          _this.refresh()
        })
      }else{
        console.log(err)
      }
    })
  }

  refresh(){
    this.global_config = this.refreshConfig(Utils.getConfigPath("pymakr.json"))
    this.timeout = 15000
    this.project_config = this.refreshConfig(this.config_file)
  }

  refreshConfig(file){
    this.logger.verbose("Refreshing config for "+file)
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
        _this.logger.warning("Syntax error in "+file)
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
    if('statusbar_buttons' in file){
      this.statusbar_buttons = file.statusbar_buttons
    }
  }

  getDefaultConfig(global){
    var config = {
        "address": this.api.config('address'),
        "username": this.api.config('username'),
        "password": this.api.config('password'),
        "sync_folder": this.api.config('sync_folder'),
        "open_on_start": this.api.config('open_on_start'),
        "statusbar_buttons": this.api.config('statusbar_buttons')
    }
    if(global){
      config.sync_file_types = this.api.config('sync_file_types')
      config.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect')
    }
    return config
  }

  openProjectSettings(cb){
    var _this = this
    if(this.project_path){
      var config_file = this.config_file
      fs.open(config_file,'r',function(err,contents){
          if(err){
            var json_string = _this.newSettingsJson()
            fs.writeFile(config_file, json_string, function(err) {
              if(err){
                cb(new Error(err))
                return
              }
              _this.watchConfigFile()
              var uri = vscode.Uri.file(config_file)
              workspace.openTextDocument(uri).then(function(textDoc){
                vscode.window.showTextDocument(textDoc)
                cb()
              })  
            })
          }else{
            var uri = vscode.Uri.file(config_file)
            workspace.openTextDocument(uri).then(function(textDoc){
              vscode.window.showTextDocument(textDoc)
              cb()
            })
          }  
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
