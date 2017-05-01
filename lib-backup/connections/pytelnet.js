'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _telnetcli = require('./telnet/telnetcli.js');

var _telnetcli2 = _interopRequireDefault(_telnetcli);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AYT = '\xff\xf6';

var PyTelnet = function () {
  function PyTelnet(params) {
    _classCallCheck(this, PyTelnet);

    this.type = "telnet";
    this.stream = new _telnetcli2.default('pycomboard');
    this.connected = false;
    this.listening = false;
    this.username_sent = false;
    this.password_sent = false;
    this.params = params;
    this.pingTimer = null;
    this.receive_buffer = "";
    this.ayt_pending = false;
  }

  _createClass(PyTelnet, [{
    key: 'sendPing',
    value: function sendPing() {
      if (this.ayt_pending) {
        this.ayt_pending = false;
        return false;
      }
      this.ayt_pending = true;
      this.send(AYT);
      return true;
    }
  }, {
    key: 'connect',
    value: function connect(onconnect, onerror, ontimeout) {
      this.onconnect = onconnect;
      this.onerror = onerror;
      this.ontimeout = ontimeout;
      this.username_sent = false;
      this.password_sent = false;
      var _this = this;
      this.stream.connect(this.params, function (err) {
        onconnect(new Error(err));
      });
      this.stream.setReportErrorHandler(function (telnet, error) {
        if (onerror) {
          if (!error) {
            error = "Connection lost";
          }
          onerror(new Error(error));
        }
      });

      var timeout_triggered = false;
      this.stream.setReportTimeoutHandler(function (telnet, error) {
        if (ontimeout) {
          if (!timeout_triggered) {
            timeout_triggered = true;
            ontimeout(error);
          }
        }
      });

      this.stream.setReportAYTHandler(function (telnetcli, type) {
        _this.ayt_pending = false;
      });
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      this.stream.close();
    }
  }, {
    key: 'registerListener',
    value: function registerListener(cb) {
      var _this = this;
      this.onmessage = cb;

      this.stream.read(function (err, recv) {
        if (recv) {
          recv = recv.join('');
          cb(recv);
        }
      });
    }
  }, {
    key: 'send',
    value: function send(mssg, cb) {
      var data = new Buffer(mssg, "binary");
      this.send_raw(data, cb);
    }
  }, {
    key: 'send_raw',
    value: function send_raw(data, cb) {
      this.stream.write(data, function () {
        if (cb) cb();
      });
    }
  }, {
    key: 'send_cmd',
    value: function send_cmd(cmd, cb) {
      var mssg = '\x1b\x1b' + cmd;
      data = new Buffer(mssg, "binary");
      this.send_raw(data, cb);
    }
  }, {
    key: 'flush',
    value: function flush(cb) {
      cb();
    }
  }]);

  return PyTelnet;
}();

exports.default = PyTelnet;