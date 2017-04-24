'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// var Terminal = require('xterm');
var vscode = require('vscode');

var Term = function () {
  function Term(element, pyboard) {
    _classCallCheck(this, Term);

    this.term_buffer = "";
    this.shellprompt = '>>> ';
    this.element = element;
    this.pyboard = pyboard;
    this.element = element;
    this.onMessage = function () {};
    this.lastWrite = "";
    var _this = this;
    // this.xterm = new Terminal({
    //   cursorBlink: true,
    //   rows: 11,
    //   cols: 120
    // });

    // this.xterm.on('key', function (key, ev) {
    //   _this.termKeyPress(_this, key, ev);
    // });
    // this.xterm.open(element);
    this.outputChannel = vscode.window.createOutputChannel('PyMakr Terminal');
    this.outputChannel.show();
  }

  _createClass(Term, [{
    key: 'setOnMessageListener',
    value: function setOnMessageListener(cb) {
      this.onMessage = cb;
    }
  }, {
    key: 'termKeyPress',
    value: function termKeyPress(_this, key, ev) {
      // var term = this.xterm;
      if (this.pyboard.connected) {
        if (ev.keyCode == 67) {
          // ctrl-c
          this.copy();
        } else if (ev.keyCode == 86) {
          //ctrl-v
          this.paste(ev);
        }
        this.userInput(key);
      }
    }
  }, {
    key: 'writeln',
    value: function writeln(mssg) {
      vscode.window.showInformationMessage(mssg);
      // this.xterm.writeln(mssg);
      this.outputChannel.append(mssg);
      this.lastWrite += mssg;
      if (this.lastWrite.length > 20) {
        this.lastWrite = this.lastWrite.substring(1);
      }
    }
  }, {
    key: 'write',
    value: function write(mssg) {
      vscode.window.showInformationMessage(mssg);
      // this.xterm.write(mssg);
      this.outputChannel.append(mssg);
      this.lastWrite += mssg;
      if (this.lastWrite.length > 20) {
        this.lastWrite = this.lastWrite.substring(1);
      }
    }
  }, {
    key: 'writeln_and_prompt',
    value: function writeln_and_prompt(mssg) {
      this.writeln(mssg + "\r\n");
      this.writePrompt();
    }
  }, {
    key: 'writePrompt',
    value: function writePrompt() {
      this.write(this.shellprompt);
    }
  }, {
    key: 'enter',
    value: function enter() {
      this.write('\r\n');
    }
  }, {
    key: 'clear',
    value: function clear() {
      // this.xterm.clear();
      this.lastWrite = "";
    }
  }, {
    key: 'userInput',
    value: function userInput(input) {
      this.onMessage(input);
    }
  }, {
    key: 'paste',
    value: function paste() {
      // this.userInput(atom.clipboard.read())
    }
  }, {
    key: 'copy',
    value: function copy(ev) {
      // atom.clipboard.write(window.getSelection().toString())
    }
  }]);

  return Term;
}();

exports.default = Term;