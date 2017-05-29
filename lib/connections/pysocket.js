'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Socket = require('net').Socket;

var PySocket = function () {
  function PySocket(params) {
    _classCallCheck(this, PySocket);

    this.type = "socket";
    this.stream = new Socket();

    this.stream.setTimeout(params.timeout);
    this.connected = false;
    this.params = params;
    this.receive_buffer = "";
    this.on_error_called = false;
  }

  _createClass(PySocket, [{
    key: 'connect',
    value: function connect(onconnect, onerror, ontimeout) {

      this.onconnect = onconnect;
      this.onerror = onerror;
      this.ontimeout = ontimeout;
      this.username_sent = false;
      this.password_sent = false;
      var _this = this;
      this.stream.connect(this.params.port, this.params.host);
      this.stream.on('connect', function () {
        onconnect();
      });
      this.stream.on('timeout', function () {
        ontimeout();
      });
      this.stream.on('error', function (error) {
        if (!_this.on_error_called) {
          _this.on_error_called = true;
          onerror(error);
        }
      });
      this.stream.on('close', function (had_error) {
        if (had_error && !_this.on_error_called) {
          _this.on_error_called = true;
          onerror();
        }
      });
      this.stream.on('end', function () {
        if (!_this.on_error_called) {
          _this.on_error_called = true;
        }
      });
    }
  }, {
    key: 'disconnect',
    value: function disconnect(cb) {
      if (this.stream) {
        this.stream.destroy();
        this.stream = null;
      }
      cb();
    }
  }, {
    key: 'registerListener',
    value: function registerListener(cb) {
      var _this = this;
      this.onmessage = cb;
      this.stream.on('data', function (data) {
        cb(data);
      });
    }
  }, {
    key: 'send',
    value: function send(mssg, cb) {
      mssg = mssg.replace('\x1b', '\x1b\x1b');
      var data = new Buffer(mssg, "binary");
      this.send_raw(data, cb);
    }
  }, {
    key: 'send_raw',
    value: function send_raw(data, cb) {
      if (this.stream) {
        this.stream.write(data, function () {
          if (cb) cb();
        });
      } else {
        cb(new Error("Not connected"));
      }
    }
  }, {
    key: 'send_cmd',
    value: function send_cmd(cmd, cb) {
      var mssg = '\x1b\x1b' + cmd;
      data = new Buffer(mssg, "binary");
      this.send_raw(data, cb);
    }
  }, {
    key: 'sendPing',
    value: function sendPing() {}
  }, {
    key: 'flush',
    value: function flush(cb) {
      cb();
    }
  }]);

  return PySocket;
}();

exports.default = PySocket;