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
  function Term(cb, pyboard) {
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
    this.connection_attempt = 1;

    //dragging
    this.startY = null;
    var _this = this;
    this.xterm = new Terminal({
      cursorBlink: true,
      rows: this.term_rows.default,
      cols: 120
    });

    this.xterm.on('key', function (key, ev) {
      _this.termKeyPress(key, ev);
    });

    this.connect(cb);
  }

  _createClass(Term, [{
    key: 'connectReattempt',
    value: function connectReattempt(cb) {
      var _this = this;
      this.connection_attempt += 1;
      setTimeout(function () {
        _this.connect(cb);
      }, 200);
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
      var _this = this;
      var startY = 0;
      var lastY = 0;
      var startHeight = 0;
      var startRows = this.term_rows.default;
      var startTermHeight = 0;
      var lineHeight = 0;
      var currentRows = startRows;

      function onMouseDown(e) {
        startY = e.clientY;
        startHeight = parseInt(document.defaultView.getComputedStyle(el).height, 10);
        startTermHeight = parseInt(document.defaultView.getComputedStyle(_this.element).height, 10);
        if (lineHeight == 0) {
          lineHeight = startTermHeight / startRows;
        }
      }
      function onMouseMove(e) {
        var new_height = startHeight + startY - e.clientY;
        var new_term_height = startTermHeight + startY - e.clientY;
        var newRows = Math.floor(new_term_height / lineHeight);
        if (newRows != currentRows && newRows <= _this.term_rows.max && newRows >= _this.term_rows.min) {
          currentRows = newRows;

          // when decreasing terminal size, this correction is needed to prevent terminal being slightly to hgh
          var correction = new_term_height % lineHeight;

          el.style.height = new_height - correction + "px";
          _this.element.style.height = new_term_height - correction + "px";
          _this.xterm.resize(120, newRows);
        }
        lastY = e.clientY;
      }

      function stopDrag() {
        console.log("remove listeners");
        document.documentElement.removeEventListener('mousemove', onMouseMove, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
      }

      resizer.addEventListener('mousedown', onMouseDown, false);
    }
  }, {
    key: 'setOnMessageListener',
    value: function setOnMessageListener(cb) {
      this.onMessage = cb;
    }
  }, {
    key: 'termKeyPress',
    value: function termKeyPress(key, ev) {
      var term = this.xterm;
      if (this.pyboard.connected) {
        if (ev.keyCode == 67) {
          // ctrl-c
          this.copy();
        } else if (ev.keyCode == 86) {
          //ctrl-v
          this.paste(ev);
        }
        this.logger.info(ev.keyCode);
        this.userInput(key);
      }
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
      this.xterm.clear();
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