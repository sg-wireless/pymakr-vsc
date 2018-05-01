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
    this.project_config = {}
    this.api = new ApiWrapper()
    this.project_path = this.api.getProjectPath()
    this.config_file = this.project_path+"/pymakr.conf"
    this.json_valid = true
    this.logger = new Logger('SettingsWrapper')
    this.project_change_callbacks = []

    this.refresh()
    this.watchConfigFile()
    this.watchProjectChange()

  }

  projectChanged(){
    this.getProjectPath()
    this.refreshProjectConfig()
    this.watchConfigFile()
  }

  getProjectPath(){
    this.project_path = this.api.getProjectPath()
    this.config_file = this.project_path+"/pymakr.conf"
    return this.project_path
  }

  registerProjectChangeWatcher(cb){
    this.project_change_callbacks.push(cb)
  }

  watchProjectChange(){
    var _this = this
    this.api.onProjectsChange(function(paths){
      _this.refreshProjectConfig()
      for(var i =0;i<_this.project_change_callbacks.length;i++){
        _this.project_change_callbacks[i](_this.project_path)
      }
    })
  }

  watchConfigFile(){
    this.logger.info("Watching config file "+this.config_file)
    var _this = this
    if(this.file_watcher){
      this.file_watcher.close()
    }
    fs.open(this.config_file,'r',function(err,content){
      if(!err){
        _this.file_watcher = fs.watch(_this.config_file,null,function(err){
          _this.logger.info("Config file changed, refreshing settings")
          _this.refreshProjectConfig()
        })
      }else{
        _this.logger.warning("Error opening config file ")
        _this.logger.warning(err)
      }
    })
  }

  refresh(){
    this.refreshProjectConfig()
    this.refreshGlobalConfig()

  }
  refreshGlobalConfig(){
    this.address = this.api.config('address')
    this.username = this.api.config('username')
    this.password = this.api.config('password')
    this.sync_folder = this.api.config('sync_folder')
    this.sync_file_types = this.api.config('sync_file_types')
    this.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect')
    this.open_on_start = this.api.config('open_on_start')
    this.safe_boot_on_upload = this.api.config('safe_boot_on_upload')
    this.statusbar_buttons = this.api.config('statusbar_buttons')
    this.reboot_after_upload = this.api.config('reboot_after_upload')

    this.timeout = 15000
    this.setProjectConfig()

    if(this.statusbar_buttons == undefined || this.statusbar_buttons == ""){
      this.statusbar_buttons = ["connect","upload","download","run"]
    }
    this.statusbar_buttons.push('global_settings')
    this.statusbar_buttons.push('project_settings')
  }

  refreshProjectConfig(){
    this.logger.info("Refreshing project config")
    var _this = this
    this.project_config = {}
    this.project_path = this.api.getProjectPath()
    this.config_file = this.project_path+"/pymakr.conf"
    var contents = null
    try{
      contents = fs.readFileSync(this.config_file,{encoding: 'utf-8'})
      this.logger.silly("Found contents")
    }catch(Error){
      // file not found
      return null
    }

    if(contents){
      try{
        var conf = JSON.parse(contents)
        _this.project_config = conf
      }catch(SyntaxError){
        if(_this.json_valid){
          _this.json_valid = false
          _this.emit('format_error')
        }else{
          _this.json_valid = true
        }
      }
      _this.setProjectConfig()
    }
  }

  setProjectConfig(){
    if('address' in this.project_config){
      this.address = this.project_config.address
    }
    if('username' in this.project_config){
      this.username = this.project_config.username
    }
    if('password' in this.project_config){
      this.password = this.project_config.password
    }
    if('sync_folder' in this.project_config){
      this.sync_folder = this.project_config.sync_folder
    }
    if('sync_file_types' in this.project_config){
      this.sync_file_types = this.project_config.sync_file_types
    }
    if('ctrl_c_on_connect' in this.project_config){
      this.ctrl_c_on_connect = this.project_config.ctrl_c_on_connect
    }
    if('open_on_start' in this.project_config){
      this.open_on_start = this.project_config.open_on_start
    }
    if('safe_boot_on_upload' in this.project_config){
      this.safe_boot_on_upload = this.project_config.safe_boot_on_upload
    }
    if('statusbar_buttons' in this.project_config){
      this.statusbar_buttons = this.project_config.statusbar_buttons
    }
    if('reboot_after_upload' in this.project_config){
      this.reboot_after_upload = this.project_config.reboot_after_upload
    }

  }

  getDefaultProjectConfig(){
    var config = {
        "address": this.api.config('address'),
        "username": this.api.config('username'),
        "password": this.api.config('password'),
        "sync_folder": this.api.config('sync_folder'),
        "open_on_start": this.api.config('open_on_start'),
        "safe_boot_on_upload": this.api.config('safe_boot_on_upload'),
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
    if(this.getProjectPath()){
      var config_file = this.config_file
      fs.open(config_file,'r',function(err,contents){
          if(err){
            var json_string = _this.newProjectSettingsJson()
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

  newProjectSettingsJson(){
    var settings = this.getDefaultProjectConfig()
    var json_string = JSON.stringify(settings,null,4)
    return json_string
  }
}
