'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('../config.js');

var _config2 = _interopRequireDefault(_config);

var _pyserial = require('../connections/pyserial');

var _pyserial2 = _interopRequireDefault(_pyserial);

var _pytelnet = require('../connections/pytelnet');

var _pytelnet2 = _interopRequireDefault(_pytelnet);

var _pysocket = require('../connections/pysocket');

var _pysocket2 = _interopRequireDefault(_pysocket);

var _authorize = require('./authorize');

var _authorize2 = _interopRequireDefault(_authorize);

var _monitor = require('./monitor');

var _monitor2 = _interopRequireDefault(_monitor);

var _logger = require('./logger.js');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var timer = require('timers');

var CTRL_A = '\x01'; // raw repl
var CTRL_B = '\x02'; // exit raw repl
var CTRL_C = '\x03'; // ctrl-c
var CTRL_D = '\x04'; // reset (ctrl-d)

//statuses
var DISCONNECTED = 0;
var CONNECTED = 1;
var FRIENDLY_REPL = 2;
var RAW_REPL = 3;
var RUNNING_FILE = 4;

var Pyboard = function () {
  function Pyboard(settings) {
    _classCallCheck(this, Pyboard);

    this.connected = false;
    this.connecting = false;
    this.receive_buffer = "";
    this.waiting_for = null;
    this.waiting_for_cb = null;
    this.waiting_for_timeout = 8000;
    this.status = DISCONNECTED;
    this.pingTimer = null;
    this.isSerial = false;
    this.type = null;
    this.settings = settings;
    this.timeout = settings.timeout;
    this.authorize = new _authorize2.default(this);
    this.logger = new _logger2.default('Pyboard');
    this.config = _config2.default.constants();
    this.refreshConfig();
  }

  _createClass(Pyboard, [{
    key: 'refreshConfig',
    value: function refreshConfig() {
      this.settings.refresh();
      this.params = {
        host: this.settings.address,
        port: 23,
        username: this.settings.username,
        password: this.settings.password,
        enpassword: "",
        timeout: this.settings.timeout,
        ctrl_c_on_connect: this.settings.ctrl_c_on_connect
      };
    }
  }, {
    key: 'getCallbacks',
    value: function getCallbacks() {
      return [this.onmessage, this.onerror, this.ontimeout, this.onmessage];
    }
  }, {
    key: 'startPings',
    value: function startPings(interval) {
      var _this = this;
      this.pingTimer = setInterval(function () {
        if (!_this.connection.sendPing()) {
          clearInterval(_this.pingTimer);
          _this.ontimeout(new Error("Connection lost"));
          _this.disconnect();
        }
      }, interval * 1000);
    }
  }, {
    key: 'stopPings',
    value: function stopPings() {
      clearInterval(this.pingTimer);
    }
  }, {
    key: 'setStatus',
    value: function setStatus(status) {
      if (status != this.status) {
        this.status = status;
        if (this.statusListenerCB) {
          this.statusListenerCB(status);
        }
      }
    }
  }, {
    key: 'registerStatusListener',
    value: function registerStatusListener(cb) {
      this.statusListenerCB = cb;
    }
  }, {
    key: 'enter_friendly_repl',
    value: function enter_friendly_repl(callback) {
      var _this = this;
      _this.send_wait_for_blocking(CTRL_B, 'Type "help()" for more information.\r\n>>>', function (err) {
        if (!err) {
          _this.setStatus(FRIENDLY_REPL);
        }
        if (callback) {
          callback(err);
        }
      });
    }
  }, {
    key: 'enter_friendly_repl_wait',
    value: function enter_friendly_repl_wait(callback) {
      var _this = this;
      _this.send_wait_for(CTRL_B, 'Type "help()" for more information.\r\n>>>', function (err) {
        if (!err) {
          _this.setStatus(FRIENDLY_REPL);
        }
        if (callback) {
          callback(err);
        }
      });
    }
  }, {
    key: 'enter_friendly_repl_non_blocking',
    value: function enter_friendly_repl_non_blocking(callback) {
      var _this = this;
      _this.send(CTRL_B, function (err) {
        if (!err) {
          _this.setStatus(FRIENDLY_REPL);
        }
        if (callback) {
          callback(err);
        }
      }, 2000);
    }
  }, {
    key: 'soft_reset',
    value: function soft_reset(cb) {
      this.send_wait_for_blocking(CTRL_D, "OK", cb, 5000);
    }
  }, {
    key: 'stop_running_programs',
    value: function stop_running_programs(cb) {
      this.send_wait_for(CTRL_C, ">>>", function () {
        if (cb) cb();
      });
    }
  }, {
    key: 'stop_running_programs_nofollow',
    value: function stop_running_programs_nofollow(callback) {
      this.send_with_enter(CTRL_C, function () {
        callback();
      });
    }
  }, {
    key: 'enter_raw_repl_no_reset',
    value: function enter_raw_repl_no_reset(callback) {
      console.log("Entering raw repl");
      var _this = this;
      this.stop_running_programs(function () {
        console.log("Stopped running programs");
        _this.flush(function () {
          console.log("Flushed");
          _this.send_wait_for_blocking(CTRL_A, 'raw REPL; CTRL-B to exit\r\n>', function (err) {
            console.log("Found after blocking wait");
            if (!err) {
              _this.setStatus(RAW_REPL);
            }
            callback(err);
          }, 5000);
        });
      });
    }
  }, {
    key: 'enter_raw_repl',
    value: function enter_raw_repl(callback) {
      var _this = this;
      this.enter_raw_repl_no_reset(function (err) {
        _this.flush(function () {
          _this.soft_reset(function (err) {
            callback();
          }, 5000);
        });
      });
    }
  }, {
    key: 'isConnecting',
    value: function isConnecting() {
      return this.connecting && !this.connected;
    }
  }, {
    key: 'connect_raw',
    value: function connect_raw(cb, onerror, ontimeout, onmessage) {
      this.connect(cb, onerror, ontimeout, onmessage, true);
    }
  }, {
    key: 'connect',
    value: function connect(callback, onerror, ontimeout, onmessage, raw) {
      this.connecting = true;
      this.onconnect = callback;
      this.onmessage = onmessage;
      this.ontimeout = ontimeout;
      this.onerror = onerror;
      this.stopWaitingForSilent();
      this.refreshConfig();
      var _this = this;
      _pyserial2.default.isSerialPort(this.params.host, function (res) {
        _this.isSerial = res;
        if (res) {
          _this.connection = new _pyserial2.default(_this.params);
        } else if (raw) {
          _this.connection = new _pysocket2.default(_this.params);
        } else {
          _this.connection = new _pytelnet2.default(_this.params);
        }
        _this.type = _this.connection.type;

        if (_this.connection.type == 'telnet') {
          _this.authorize.run(function (error) {
            if (error) {
              _this._disconnected();
              callback(error);
            } else {
              _this._onconnect(callback);
            }
          });
        }

        _this.connection.connect(function () {
          _this.connection.registerListener(function (mssg) {
            _this.receive(mssg);
          });
          if (_this.connection.type != 'telnet') {
            _this._onconnect(callback);
          }
        }, function (err) {
          _this._disconnected();
          _this.onerror(err);
        }, function (mssg) {
          // Timeout callback only works properly during connect
          // after that it might trigger unneccesarily
          if (_this.isConnecting()) {
            _this._disconnected();
            ontimeout(mssg);
          }
        });
      });
    }
  }, {
    key: '_onconnect',
    value: function _onconnect(cb) {
      var _this = this;

      _this.connected = true;
      _this.connection.connected = true;

      _this.connecting = false;

      if (_this.params.ctrl_c_on_connect && this.type != "socket") {
        _this.stop_running_programs(cb);
      } else {
        cb();
      }

      if (_this.connection.type == 'telnet') {
        _this.startPings(5);
      }
    }
  }, {
    key: '_disconnected',
    value: function _disconnected(cb) {
      if (this.connection) {
        this.connection.disconnect(function () {
          if (cb) {
            cb();
          }
        });
      }
      this.connecting = false;
      this.connected = false;
      this.stopPings();
    }
  }, {
    key: 'receive',
    value: function receive(mssg) {
      this.logger.silly('Received message: ' + mssg);
      if (!this.wait_for_block && (typeof mssg === 'undefined' ? 'undefined' : _typeof(mssg)) != 'object') {
        this.onmessage(mssg);
      }

      if (this.waiting_for != null) {
        this.logger.silly("Waiting for " + this.waiting_for);
        this.receive_buffer += mssg;
        if (this.receive_buffer.indexOf("Invalid credentials, try again.") > -1) {
          this._disconnected();
          this.onconnect("Invalid credentials");
          this.stopWaitingForSilent();
          this.wait_for_blocking("Login as:", function () {
            // do nothing
          });
        }
        if (this.waiting_for_type == 'length') {
          this.logger.silly("Waiting for " + this.waiting_for + ", got " + this.receive_buffer.length + " so far");
          if (this.receive_buffer.length >= this.waiting_for) {
            this.stopWaitingFor(this.receive_buffer);
          }
        } else if (this.receive_buffer.indexOf(this.waiting_for) > -1) {
          var trail = this.receive_buffer.split(this.waiting_for).pop(-1);
          if (trail.length > 0 && this.wait_for_block) {
            this.onmessage(trail);
          }
          this.stopWaitingFor(mssg);
        }
      }
    }
  }, {
    key: 'stopWaitingForSilent',
    value: function stopWaitingForSilent() {
      clearTimeout(this.waiting_for_timer);
      this.waiting_for = null;
      this.wait_for_block = false;
    }
  }, {
    key: 'stopWaitingFor',
    value: function stopWaitingFor(mssg) {
      this.stopWaitingForSilent();
      if (this.waiting_for_cb) {
        this.waiting_for_cb(null, mssg);
      }
    }
  }, {
    key: 'disconnect',
    value: function disconnect(cb) {
      this.disconnect_silent(cb);
      this.setStatus(DISCONNECTED);
    }
  }, {
    key: 'disconnect_silent',
    value: function disconnect_silent(cb) {
      this._disconnected(cb);
    }
  }, {
    key: 'run',
    value: function run(filecontents, cb) {
      var _this = this;
      this.stop_running_programs(function () {
        _this.enter_raw_repl_no_reset(function () {
          // var contents = filecontents.replace('\n','\n\r')
          _this.setStatus(RUNNING_FILE);
          var run_delay = _this.type == 'serial' ? 300 : 0;
          setTimeout(function () {
            _this.exec_raw(filecontents + "\r\n", function () {
              _this.wait_for(">", function () {
                _this.enter_friendly_repl_wait(cb);
              });
            });
          }, run_delay);
        });
      });
    }
  }, {
    key: 'send',
    value: function send(mssg, cb) {
      this.connection.send(mssg, cb);
    }
  }, {
    key: 'send_with_enter',
    value: function send_with_enter(mssg, cb) {
      this.connection.send(mssg + '\r\n', cb);
    }
  }, {
    key: 'send_cmd',
    value: function send_cmd(cmd, cb) {
      var mssg = '\x1b' + cmd;
      var data = new Buffer(mssg, "binary");
      this.connection.send_raw(data, cb);
    }
  }, {
    key: 'send_cmd_read',
    value: function send_cmd_read(cmd, wait_for, cb, timeout) {

      if (typeof wait_for == "string") {
        wait_for = "\x1b" + wait_for;
        wait_for = new Buffer(wait_for, "binary");
      }
      this.read(wait_for, cb, timeout);
      this.send_cmd(cmd);
    }
  }, {
    key: 'send_cmd_wait_for',
    value: function send_cmd_wait_for(cmd, wait_for, cb, timeout) {

      if (typeof wait_for == "string") {
        wait_for = "\x1b" + wait_for;
        wait_for = new Buffer(wait_for, "binary");
      }
      this.wait_for(wait_for, cb, timeout);
      this.send_cmd(cmd, function () {});
    }
  }, {
    key: 'send_user_input',
    value: function send_user_input(mssg, cb) {
      this.send(mssg, cb);
    }
  }, {
    key: 'send_raw_wait_for',
    value: function send_raw_wait_for(mssg, wait_for, cb, timeout) {
      this.wait_for(wait_for, cb, timeout);
      this.send_raw(mssg);
    }
  }, {
    key: 'send_wait_for',
    value: function send_wait_for(mssg, wait_for, cb, timeout) {
      this.wait_for(wait_for, cb, timeout);
      this.send_with_enter(mssg);
    }
  }, {
    key: 'send_wait_for_blocking',
    value: function send_wait_for_blocking(mssg, wait_for, cb, timeout) {
      this.wait_for_blocking(wait_for, cb, timeout);
      this.send_with_enter(mssg);
    }
  }, {
    key: 'wait_for_blocking',
    value: function wait_for_blocking(wait_for, cb, timeout, type) {
      this.wait_for(wait_for, cb, timeout, type);
      this.wait_for_block = true;
    }
  }, {
    key: 'send_read',
    value: function send_read(mssg, number, cb, timeout) {
      this.read(number, cb, timeout);
      this.send_with_enter(mssg);
    }
  }, {
    key: 'read',
    value: function read(number, cb, timeout) {
      this.wait_for_blocking(number, cb, timeout, 'length');
    }
  }, {
    key: 'wait_for',
    value: function wait_for(_wait_for, cb, timeout, type) {
      if (!type) {
        type = 'string';
      }
      this.waiting_for_type = type;
      this.wait_for_block = false;
      this.waiting_for = _wait_for;
      this.waiting_for_cb = cb;
      this.waiting_for_timeout = timeout;
      this.receive_buffer = "";
      var _this = this;
      if (timeout) {
        this.waiting_for_timer = setTimeout(function () {
          if (_this.waiting_for_cb) {
            _this.waiting_for_cb(new Error("timeout"), _this.receive_buffer);
            _this.waiting_for_cb = null;
            _this.wait_for_block = false;
            _this.waiting_for = null;
          }
        }, timeout);
      }
    }
  }, {
    key: 'send_raw',
    value: function send_raw(mssg, cb) {
      this.connection.send_raw(mssg, cb);
    }
  }, {
    key: 'exec_raw_no_reset',
    value: function exec_raw_no_reset(code, cb) {
      var command_bytes = new Buffer(code, "binary");
      // for(var i=0;i<command_bytes.length;i+=265){
      var data = command_bytes;
      var _this = this;
      this.send_raw(data, function (err) {
        cb(err);
      });
    }
  }, {
    key: 'exec_raw',
    value: function exec_raw(code, cb) {
      var _this = this;
      this.exec_raw_no_reset(code, function () {
        // _this.flush(function(){
        _this.soft_reset(function () {
          cb();
        });
        // })
      });
    }
  }, {
    key: 'flush',
    value: function flush(cb) {
      this.connection.flush(cb);
    }
  }, {
    key: 'getErrorMessage',
    value: function getErrorMessage(text) {
      var messages = this.config.error_messages;
      for (var key in messages) {
        if (key.indexOf(text) > -1) {
          return messages[key];
        }
      }
      return "";
    }
  }]);

  return Pyboard;
}();

exports.default = Pyboard;