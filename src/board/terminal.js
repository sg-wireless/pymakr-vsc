'use babel';
var vscode = require('vscode');
let Terminal = require('xterm')
import Logger from './logger.js'
import Config from '../config.js'
import ApiWrapper from '../api-wrapper.js';

export default class Term {

    constructor(element,pyboard) {
      this.term_buffer = ""
      this.shellprompt = '>>> ';
      this.element = element
      this.pyboard = pyboard
      this.element = element
      this.logger = new Logger('Term')
      this.api = new ApiWrapper()
      this.onMessage = function(){}
      this.term_rows = Config.constants().term_rows
      this.lastWrite = ""

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

      // // for copy-paste with cmd key
      // this.element.addEventListener("keydown",function(e) {
      //   if ((e.keyCode == 67 || e.keyCode == 86) && e.metaKey) {
      //     _this.termKeyPress("",e)
      //   }
      // })

      // this.outputChannel = vscode.window.createOutputChannel('PyMakr Terminal');
      // this.outputChannel.show();

      // this.terminal = vscode.window.createTerminal("Pymakr","node ./terminalExec.js",["blaat"])
      // this.terminal.show(true)

      // this.xterm.open(element,true);
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
        // document.documentElement.addEventListener('mousemove',onMouseMove,false)
        // document.documentElement.addEventListener('mouseup',stopDrag,false)

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
      // this.xterm.writeln(mssg)
      // this.outputChannel.append(mssg);
      // this.terminal.sendText(mssg)
      console.log(mssg+"\r\n")

      this.lastWrite += mssg
      if(this.lastWrite.length > 20){
        this.lastWrite = this.lastWrite.substring(1)
      }
    }

    write(mssg){
      // this.xterm.write(mssg)
      // this.outputChannel.append(mssg);
      // this.terminal.sendText(mssg)
      console.log(mssg)

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
