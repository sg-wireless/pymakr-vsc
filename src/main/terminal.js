'use babel';
var vscode = require('vscode');
let Terminal = require('xterm')
import Logger from '../helpers/logger.js'
import Config from '../config.js'
import ApiWrapper from '../main/api-wrapper.js';

var Socket = require('net').Socket;

export default class Term {

    constructor(cb,pyboard,settings) {
      this.port = parseInt(Math.random()*1000 + 1337)
      this.host = "127.0.0.1"
      this.term_buffer = ""
      this.shellprompt = '>>> ';
      this.pyboard = pyboard
      this.logger = new Logger('Term')
      this.api = new ApiWrapper()
      this.onMessage = function(){}
      this.term_rows = Config.constants().term_rows
      this.lastWrite = ""
      this.sw = settings
      this.connection_attempt = 1
      this.active = true
      this.terminal = null
      this.create_failed = false

      //dragging
      this.startY = null
      var _this = this
      this.create()

      this.connect(cb)

      vscode.window.onDidCloseTerminal(function(){
        if(!_this.create_failed){
          // _this.create()
        }
      })
    }

    show(){
      this.active = true
      this.terminal.show()
    }

    hide(){
      this.active = false
      this.terminal.hide()
    }

    connectReattempt(cb){
      var _this = this
      this.connection_attempt +=1
      setTimeout(function(){
        _this.connect(cb)
      },200)
      
    }

    create(){
      console.log(this.port)
      this.create_failed = false
      try{
        var shellpath = this.api.getPackagePath() + "terminalExec.js"
        console.log(shellpath)
        this.terminal = vscode.window.createTerminal({name: "Pycom Console", shellPath: shellpath, shellArgs: [this.port]} )
        // if(this.sw.open_on_start){
            this.show()
        // }
      }catch(e){
        this.create_failed = true
      }
    }

    connect(cb){
      
      console.log("Connection atempt "+this.connection_attempt)
      console.log("Connecting on "+this.port)
      if(this.connection_attempt > 8) {
        cb(new Error("Unable to start the terminal. Restart VSC or file an issue on our github"))
        return
      }
      var _this = this
      var stopped = false
      this.stream = new Socket();
      this.stream.connect(this.port,this.host);
      this.stream.on('connect',cb);
      this.stream.on('timeout', function () {
        if(!stopped){
          stopped = true
          _this.connectReattempt(cb)
        }
      });
      this.stream.on('error', function (error) {
        console.log('Error:')
        console.log(error)
        if(!stopped){
          stopped = true
          _this.connectReattempt(cb)
        }
      });
      this.stream.on('close', function (had_error) {
        console.log("closed")
        console.log(had_error)
        if(!stopped){
          stopped = true
          _this.connectReattempt(cb)
        }
      });
      this.stream.on('end', function () {
          console.log("Ended")
          if(!stopped){
          stopped = true
          _this.connectReattempt(cb)
        }
      });
      this.stream.on('data', function (data) {
        _this.userInput(data)
      });
    }

    initResize(el,resizer){
      // not implemented
    }

    setOnMessageListener(cb){
      this.onMessage = cb
    }

    writeln(mssg){
      this.stream.write(mssg+"\r\n")
      this.lastWrite += mssg
      if(this.lastWrite.length > 20){
        this.lastWrite = this.lastWrite.substring(1)
      }
    }

    write(mssg){
      this.stream.write(mssg)
      this.lastWrite += mssg
      if(this.lastWrite.length > 20){
        this.lastWrite = this.lastWrite.substring(1)
      }
    }

    writeln_and_prompt(mssg){
      this.writeln(mssg+"\r\n")
      this.writePrompt()
    }

    writePrompt(){
      this.write(this.shellprompt)
    }

    enter(){
      this.write('\r\n')
    }

    clear(){
      this.lastWrite = ""
    }

    userInput(input){
      this.onMessage(input)
    }

    paste(){
      var content = this.api.clipboard().replace(/\n/g,'\r')
      this.userInput(content)
    }

    copy(ev){
      var selection = window.getSelection().toString()
      if(selection.length > 0) {
        this.logger.silly("Copied content to clipboard of length "+selection.length)
        this.api.writeClipboard(selection)
      }
    }
}
