'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logger = require('./logger.js');

var _logger2 = _interopRequireDefault(_logger);

var _config = require('../config.js');

var _config2 = _interopRequireDefault(_config);

var _apiWrapper = require('../api-wrapper.js');

var _apiWrapper2 = _interopRequireDefault(_apiWrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var vscode = require('vscode');
var Terminal = require('xterm');


var Socket = require('net').Socket;

var Term = function () {
  function Term(cb, pyboard, settings) {
    _classCallCheck(this, Term);

    this.port = "1337";
    this.host = "127.0.0.1";
    this.term_buffer = "";
    this.shellprompt = '>>> ';
    this.pyboard = pyboard;
    this.logger = new _logger2.default('Term');
    this.api = new _apiWrapper2.default();
    this.onMessage = function () {};
    this.term_rows = _config2.default.constants().term_rows;
    this.lastWrite = "";
    this.sw = settings;
    this.connection_attempt = 1;
    this.active = true;
    this.terminal = null;

    //dragging
    this.startY = null;
    var _this = this;
    this.create();

    this.connect(cb);
  }

  _createClass(Term, [{
    key: 'show',
    value: function show() {
      this.active = true;
      this.terminal.show();
    }
  }, {
    key: 'hide',
    value: function hide() {
      this.active = false;
      this.terminal.hide();
    }
  }, {
    key: 'connectReattempt',
    value: function connectReattempt(cb) {
      var _this = this;
      this.connection_attempt += 1;
      setTimeout(function () {
        _this.connect(cb);
      }, 200);
    }
  }, {
    key: 'create',
    value: function create() {
      this.terminal = vscode.window.createTerminal({ name: "Pycom Console", shellPath: this.api.getPackagePath() + "terminalExec.js" });
      if (this.sw.open_on_start) {
        this.show();
      }
    }
  }, {
    key: 'connect',
    value: function connect(cb) {

      console.log("Connection atempt " + this.connection_attempt);
      if (this.connection_attempt > 8) {
        cb(new Error("Unable to start the terminal. Restart VSC or file an issue on our github"));
        return;
      }
      var _this = this;
      var stopped = false;
      this.stream = new Socket();
      this.stream.connect(this.port, this.host);
      this.stream.on('connect', cb);
      this.stream.on('timeout', function () {
        if (!stopped) {
          stopped = true;
          _this.connectReattempt(cb);
        }
      });
      this.stream.on('error', function (error) {
        console.log(error);
        if (!stopped) {
          stopped = true;
          _this.connectReattempt(cb);
        }
      });
      this.stream.on('close', function (had_error) {
        console.log("closed");
        console.log(had_error);
        if (!stopped) {
          stopped = true;
          _this.connectReattempt(cb);
        }
      });
      this.stream.on('end', function () {
        console.log("Ended");
        if (!stopped) {
          stopped = true;
          _this.connectReattempt(cb);
        }
      });
      this.stream.on('data', function (data) {
        _this.userInput(data);
      });
    }
  }, {
    key: 'initResize',
    value: function initResize(el, resizer) {
      // not implemented
    }
  }, {
    key: 'setOnMessageListener',
    value: function setOnMessageListener(cb) {
      this.onMessage = cb;
    }
  }, {
    key: 'writeln',
    value: function writeln(mssg) {
      this.stream.write(mssg + "\r\n");
      this.lastWrite += mssg;
      if (this.lastWrite.length > 20) {
        this.lastWrite = this.lastWrite.substring(1);
      }
    }
  }, {
    key: 'write',
    value: function write(mssg) {
      this.stream.write(mssg);
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
      var content = this.api.clipboard().replace(/\n/g, '\r');
      this.userInput(content);
    }
  }, {
    key: 'copy',
    value: function copy(ev) {
      var selection = window.getSelection().toString();
      if (selection.length > 0) {
        this.logger.silly("Copied content to clipboard of length " + selection.length);
        this.api.writeClipboard(selection);
      }
    }
  }]);

  return Term;
}();

exports.default = Term;