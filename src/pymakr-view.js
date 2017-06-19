'use babel';
var vscode = require('vscode');
import {StatusBarAlignment, StatusBarItem, window, workspace,commands} from "vscode";

import Pyboard from './board/pyboard';
import Sync from './board/sync';
import Term from './board/terminal';
import Pyserial from './connections/pyserial';
import ApiWrapper from './api-wrapper.js';

var fs = require('fs');
var ElementResize = require("element-resize-detector");

export default class PymakrView {

  constructor(serializedState,pyboard,settings) {
    var _this = this
    this.pyboard = pyboard
    this.visible = true
    this.running_file = false
    this.synchronizing = false
    this.settings = settings
    this.api = new ApiWrapper()

    this.statusItemStatus = this.createStatusItem("","pymakr.toggleREPL","Toggle terminal") // name is set using setTitle function
    this.statusItemRun = this.createStatusItem("$(triangle-right) Run","pymakr.run","Run current file")
    this.statusItemSync = this.createStatusItem("$(triangle-down) Sync","pymakr.sync","Synchronize project")
    this.statusItemOther = this.createStatusItem("$(list-unordered) All commands","pymakr.listCommands","List all available pymakr commands")
    this.setTitle("not connected")

    // terminal logic
    var onTermConnect = function(){
      if(_this.settings.open_on_start){
        console.log("Connecting")
        _this.connect()
      }
    }
    this.terminal = new Term(onTermConnect,this.pyboard)

    var term = this.terminal
    term.setOnMessageListener(function(input){
      _this.userInput(input)
    })

    this.pyboard.registerStatusListener(function(status){
      if(status == 3){
        _this.terminal.enter()
      }
    })

    // hide panel if it was hidden after last shutdown of atom
    if(serializedState && 'visible' in serializedState) {
      if(!serializedState.visible){
        this.hidePanel()
      }
    }

    this.settings.on('format_error',function(){
      _this.terminal.writeln("JSON format error in pymakr.conf file")
      if(_this.pyboard.connected){
        _this.terminal.writePrompt()
      }
    })
  }

  createStatusItem(name,command,tooltip){
    if(!this.statusItemPrio){
      this.statusItemPrio = 10
    }
    var statusBarItem = vscode.window.createStatusBarItem(StatusBarAlignment.Left,this.statusItemPrio)
    statusBarItem.command = command
    statusBarItem.text = name
    statusBarItem.tooltip = tooltip
    statusBarItem.show()
    this.statusItemPrio-=1
    return statusBarItem
  }

  showQuickPick(){
    var _this = this
    var items = [];
    items.push({ label: "Pymakr > Connect", description: "", cmd: "pymakr.connect" });
    items.push({ label: "Pymakr > Disconnect", description: "", cmd: "pymakr.disconnect" });
    items.push({ label: "Pymakr > Run current file", description: "", cmd: "pymakr.run" });
    items.push({ label: "Pymakr > Synchronize Project", description: "", cmd: "pymakr.sync" });
    items.push({ label: "Pymakr > Project Settings", description: "", cmd: "pymakr.projectSettings" });
    items.push({ label: "Pymakr > Global Setting", description: "", cmd: "pymakr.globalSettings" });
    items.push({ label: "Pymakr > Extra > Get board version", description: "", cmd: "pymakr.getVersion" });
    items.push({ label: "Pymakr > Extra > Get WiFi AP SSID", description: "", cmd: "pymakr.getWifiMac" });
    items.push({ label: "Pymakr > Extra > List Serial Ports", description: "", cmd: "pymakr.listCommands" });
    items.push({ label: "Pymakr > Help", description: "", cmd: "pymakr.help" });

    var options = {
        placeHolder: "Select Action"
    };

    window.showQuickPick(items, options).then(function(selection){
        if (typeof selection === "undefined") {
            return;
        }
        
        commands.executeCommand(selection.cmd)
        // if (selection.cmd == "pymakr.run") {
        //     _this.run()
        // }
    });
  }

  // called when user typed a command in the terminal
  userInput(input){
    var _this = this
    // this.terminal.write('\r\n')
    if(input != undefined){
      this.pyboard.send_user_input(input,function(err){
        if(err && err.message == 'timeout'){
          _this.disconnect()
        }
      })
      if(!this.pyboard.connected){
        this.connect()
      }
    }
  }

  writeHelpText(){
    var lines = []
    console.log("Creating lines")
    lines.push("Pymakr VSC Plugin Help. Commands to use (cmd/ctrl + p):")
    lines.push("- Connect           : Opens terminal and connects to the board")
    lines.push("- Disconnect        : Disconnects from the board")
    lines.push("- Global settings   : Opens the installation-wide settings file")
    lines.push("- Project Settings  : Opens project specific settings that overwrite global settings")
    lines.push("- Run               : Runs currently open file to the board")
    lines.push("- Sync              : Synchronizes the complete project to the board, using the sync folder settings")
    lines.push("- List serial ports : Lists all available serial ports and copies the first one to the clipboard")
    lines.push("- Get board version : Displays firmware version of the connected board")
    lines.push("- Get WiFi SSID     : Gets the SSID of the boards wifi accesspoint")
    lines.push("")

    lines.push("Settings (name : default : description):")
    lines.push("address           : 192.168.4.1         : IP address or comport for your device")
    lines.push("username          : micro               : Boards username, only for telnet")
    lines.push("password          : python              : Boards password, only for telnet")
    lines.push("sync_folder       : <empty>             : Folder to synchronize. Empty to sync projects main folder")
    lines.push("sync_file_types   : py,txt,log,json,xml : Type of files to be synchronized")
    lines.push("ctrl_c_on_connect : false               : If true, executes a ctrl-c on connect to stop running programs")
    lines.push("open_on_start     : true                : Weather to open the terminal and connect to the board when starting vsc")
    lines.push("Any of these can be used inside the Project Settings file and will overwrite global settings when the project is open")
    
    console.log("Writing enter")
    this.terminal.enter()
    for(var i=0;i<lines.length;i++){
      console.log("Writing "+lines[i])
      this.terminal.writeln(lines[i])
    }

    console.log("Done")
    if(this.pyboard.connected){
      console.log("Write prompt")
      this.terminal.writePrompt()
    }
  }

  getSerial(){
    var _this = this
    this.terminal.enter()

    Pyserial.list(function(list){
      _this.terminal.writeln("Found "+list.length+" serialport"+(list.length == 1 ? "" : "s"))
      for(var i=0;i<list.length;i++){
        var text = list[i]
        if(i==0){
          _this.api.writeToCipboard(text)
          text += " (copied to clipboard)"
        }
        _this.terminal.writeln(text)
      }
      if(_this.pyboard.connected){
        _this.terminal.writePrompt()
      }
    })
  }

  getVersion(){
    this.pyboard.send("import os; os.uname().release\r\n")
  }
  
  getWifiMac(){
    var _this = this
    var command = "from network import WLAN; from binascii import hexlify; from os import uname; wlan = WLAN(); mac = hexlify(wlan.mac()).decode('ascii'); device = uname().sysname;print('WiFi AP SSID: %(device)s-wlan-%(mac)s' % {'device': device, 'mac': mac[len(mac)-4:len(mac)]})"
      _this.pyboard.send_wait_for_blocking(command+'\n\r',command,function(err){
        if(err){
          _this.logger.error("Failed to send command: "+command)
        }
      },1000)
  }

  openProjectSettings(){
    this.settings.openProjectSettings(function(err){
        if(err){
          console.log(err)
          _this.terminal.writeln(err.message)
          if(_this.pyboard.connected){
            _this.terminal.writePrompt()
          }
        }
      })
  }

  openGlobalSettings(){
    this.settings.openGlobalSettings(function(){
      console.log("Callback done")
    })
  }

  // refresh button display based on current status
  setButtonState(){
    if (!this.visible) {
      // this.button_sync.classList.add('hidden')
      // this.button_run.classList.add('hidden')
      // this.button_connect.classList.add('hidden')
      // this.button_settings.classList.add('hidden')
      // this.button_more.classList.add('hidden')
      this.setTitle('not connected')
    }else if(this.pyboard.connected) {
      if(this.running_file){
        // this.button_run.innerHTML = 'Cancel'
        // this.button_run.classList.add('cancel')
        // this.button_sync.classList = ['']
        // this.button_sync.classList.add('hidden')
      }else{
        // this.button_run.innerHTML = '<span class="fa fa-play"></span> Run'
        // this.button_run.classList = ['']
        // this.button_sync.classList = ['']
      }
      // this.button_connect.innerHTML = '<span class="fa fa-refresh"></span> Reconnect'
      // this.button_settings.classList = ['']
      // this.button_more.classList = ['']
      this.setTitle('connected')

    }else{
      // this.button_connect.classList = ['']
      // this.button_connect.innerHTML = '<span class="fa fa-exchange"></span> Connect'
      // this.button_run.classList.add('hidden')
      // this.button_sync.classList.add('hidden')
      // this.button_more.classList = ['']
      // this.button_settings.classList = ['']
      this.setTitle('not connected')
    }
  }

  setTitle(status){
    var icon = "x"
    if(status == "connected"){
      icon = "check"
    }
    this.statusItemStatus.text = "$("+icon+") Pycom Console"
    // this.title.innerHTML = 'Pycom Console ('+status+')'
  }

  connect(){
    var _this = this

    var continueConnect = function(){
      _this.pyboard.refreshConfig()
      var address = _this.pyboard.params.host
      if(address == "" || address == null){
        _this.terminal.writeln("Address not configured. Please go to the settings to configure a valid address or comport");
      }else{
        _this.terminal.writeln("Connecting on "+address+"...");

        var onconnect = function(err){

          if(err){
              _this.terminal.writeln("Connection error: "+err)
          }else{
            // TODO: make this line appear in the terminal before the first messages from the board arrive (>>> in most cases)
            // _this.terminal.writeln("Connected via "+_this.pyboard.connection.type+"\r\n")
          }
          _this.setButtonState()
        }

        var onerror = function(err){
          var message = _this.pyboard.getErrorMessage(err.message)
          if(message == ""){
            message = err.message ? err.message : "Unknown error"
          }
          _this.terminal.writeln("> Failed to connect ("+message+").")
          _this.setButtonState()
        }

        var ontimeout = function(err){
          _this.terminal.writeln("> Connection timed out. ")
          _this.setButtonState()
        }

        var onmessage = function(mssg){
          if(!_this.synchronizing){
            _this.terminal.write(mssg)
          }
        }

        _this.pyboard.connect(onconnect,onerror, ontimeout, onmessage)
      }
    }

    // stop config observer from triggering again
    clearTimeout(this.observeTimeout)
    if(this.pyboard.connected || this.pyboard.connecting){
      this.disconnect(continueConnect)
    }else{
      continueConnect()
    }
  }

  disconnect(cb){
    if(this.pyboard.isConnecting()){
        this.terminal.writeln("Canceled")
    }else{
      this.terminal.writeln("Disconnected.")
    }
    this.pyboard.disconnect(cb)
    this.term_buffer = ""
    this.synchronizing = false
    this.running_file = false
    this.setButtonState()

  }

  run(){
    var _this = this
    if(this.running_file){
      console.log("Stop running now")
      this.pyboard.stop_running_programs_nofollow(function(){
        _this.pyboard.flush(function(){
          _this.pyboard.enter_friendly_repl(function(){
          })
          _this.running_file = false
          _this.setButtonState()
        })
      })

    }else{
      console.log("Getting current file")
      this.api.getCurrentFile(function(fileContents,filename){
        _this.terminal.writeln("Running "+filename)
        _this.running_file = true
        _this.setButtonState()
        _this.pyboard.run(fileContents,function(){
          _this.running_file = false
          _this.setButtonState()
        })
      },function onerror(err){
        _this.terminal.writeln_and_prompt(err)
      })
    }
  }

  sync(){
    console.log("Started sync method")
    console.log(this.settings)
    console.log(this.settings.sync_folder)
    var sync_folder = this.settings.sync_folder
    console.log(sync_folder)
    var folder_name = sync_folder == "" ? "main folder" : sync_folder

    console.log("Sync object "+folder_name)
    this.syncObj = new Sync(this.pyboard)
    console.log("Created done")
    
    var _this = this

    console.log("Terminal enter")
    this.terminal.enter()
    console.log("Terminal enter done")


    // check if there is a project open
    if(!this.syncObj.project_path){
      console.log("No project path")
      this.terminal.write("No project open\r\n")
      return;
    }
    // check if project exists
    if(!this.syncObj.exists(sync_folder)){
        console.log("Folder doesn't exist")
        this.terminal.write("Unable to find folder '"+folder_name+"'. Please add the correct folder in your settings\r\n")
        return;
    }

    // start sync
    console.log("Sync to true")
    this.terminal.write("Syncing project ("+folder_name+")...\r\n")
    this.synchronizing = true
    console.log("Sync set to true")

    // called after sync is completed
    var oncomplete = function(err){

      if(err){
        _this.terminal.writeln("Synchronizing failed: "+err.message+". Please reboot your device manually.")
        if(_this.pyboard.type != 'serial'){
          _this.connect()
        }
        _this.synchronizing = false
        _this.pyboard.stopWaitingForSilent()
        _this.setButtonState()
      }else{
        _this.terminal.writeln("Synchronizing done, resetting board...")
        _this.setButtonState()

        // on telnet/socket, we need to give the board some time to reset the connection
        if(_this.pyboard.type != 'serial'){
          setTimeout(function(){
              _this.connect()
              _this.synchronizing = false
          },2000)
        }else{
          _this.synchronizing = false
        }
      }
    }

    console.log("oncomplete defined")

    // called every time the sync starts writing a new file or folder
    var onprogress = function(text){
      _this.terminal.writeln(text)
    }

    console.log("onprogress defined")

    console.log("Starting sync")
    _this.syncObj.start(sync_folder,oncomplete,onprogress)

  }

  // UI Stuff
  addPanel(){
    this.api.addBottomPanel(
      {
        item: this.getElement(),
        visible: true,
        priority: 100
      }
    )
  }

  setPanelHeight(height){
    if(!height){
      height = (this.terminal_el.offsetHeight + 25)
    }
    this.element.style.height = height + "px"

  }

  hidePanel(){
    this.setPanelHeight(25) // 25px displays only the top bar
    this.button_close.innerHTML = '<span class="fa fa-chevron-up"></span> Open'
    this.element.classList.remove("open")
    this.visible = false
    this.disconnect()
  }

  showPanel(){
    this.terminal.clear()
    this.setPanelHeight() // no param wil make it auto calculate based on xterm height
    this.button_close.innerHTML = '<span class="fa fa-chevron-down"></span> Close'
    this.element.classList.add("open")
    this.visible = true
    this.setButtonState()
    this.connect()
  }

  toggleVisibility(){
    this.visible ? this.hidePanel() : this.showPanel();
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    return {visible: this.visible}
  }

  // Tear down any state and detach
  destroy() {
    this.disconnect()
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
