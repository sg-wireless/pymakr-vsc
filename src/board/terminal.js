'use babel';
var vscode = require('vscode');
let Terminal = require('xterm')
import Logger from './logger.js'
import Config from '../config.js'
import ApiWrapper from '../api-wrapper.js';

var Socket = require('net').Socket;

export default class Term {

    constructor(cb,pyboard) {
      this.port = "1337"
      this.host = "127.0.0.1"
      this.term_buffer = ""
      this.shellprompt = '>>> ';
      this.pyboard = pyboard
      this.logger = new Logger('Term')
      this.api = new ApiWrapper()
      this.onMessage = function(){}
      this.term_rows = Config.constants().term_rows
      this.lastWrite = ""
      this.connection_attempt = 1

      //dragging
      this.startY = null
      var _this = this
      this.xterm = new Terminal({
        cursorBlink: true,
        rows:this.term_rows.default,
        cols:120
      });

      this.xterm.on('key',function(key,ev){
        _this.termKeyPress(key,ev)
      })

      this.connect(cb)
    }

    connectReattempt(cb){
      var _this = this
      this.connection_attempt +=1
      setTimeout(function(){
        _this.connect(cb)
      },200)
      
    }

    connect(cb){
      
      console.log("Connection atempt "+this.connection_attempt)
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
      var _this = this
      var startY = 0
      var lastY = 0
      var startHeight = 0
      var startRows = this.term_rows.default
      var startTermHeight = 0
      var lineHeight = 0
      var currentRows = startRows

      function onMouseDown(e){
        startY = e.clientY
        startHeight = parseInt(document.defaultView.getComputedStyle(el).height, 10)
        startTermHeight = parseInt(document.defaultView.getComputedStyle(_this.element).height, 10)
        if(lineHeight == 0){
          lineHeight = startTermHeight / startRows
        }

      }
      function onMouseMove(e){
        var new_height = (startHeight + startY - e.clientY)
        var new_term_height = (startTermHeight + startY - e.clientY)
        var newRows = Math.floor(new_term_height / lineHeight)
        if(newRows != currentRows && newRows <= _this.term_rows.max && newRows >= _this.term_rows.min){
          currentRows = newRows

           // when decreasing terminal size, this correction is needed to prevent terminal being slightly to hgh
          var correction = (new_term_height%lineHeight)

          el.style.height = new_height - correction + "px"
          _this.element.style.height = new_term_height - correction + "px"
          _this.xterm.resize(120,newRows)
        }
        lastY = e.clientY
      }

      function stopDrag(){
        console.log("remove listeners")
        document.documentElement.removeEventListener('mousemove',onMouseMove,false)
        document.documentElement.removeEventListener('mouseup',stopDrag,false)
      }

      resizer.addEventListener('mousedown',onMouseDown,false)
    }

    setOnMessageListener(cb){
      this.onMessage = cb
    }

    termKeyPress(key,ev){
      var term = this.xterm
      if (this.pyboard.connected) {
        if(ev.keyCode == 67) { // ctrl-c
          this.copy()
        }else if(ev.keyCode == 86){ //ctrl-v
          this.paste(ev)
        }
        this.logger.info(ev.keyCode)
        this.userInput(key)
      }
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
      this.xterm.clear()
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
