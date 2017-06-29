'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');

var COMPORT_MANUFACTURERS = ['Pycom Ltd.', 'FTDI', 'Pycom'];

var SerialPort = null;
try {
  SerialPort = require("serialport");
} catch (e) {
  // include the precompiled version of serialport
  var precompiles = { 'win32': 'win', 'darwin': 'osx', 'linux': 'linux', 'aix': 'linux' };
  if (process.platform in precompiles) {
    // always returns win32 on windows, even on 64bit

    var plf = precompiles[process.platform];
    if (plf == 'win' && process.arch == 'ia32') {
      plf = 'win32';
    }
    console.log(plf);
    SerialPort = require("../../precompiles/serialport-" + plf + "/lib/serialport");
  } else {
    // when platform returns sunos, openbsd or freebsd (or 'android' in some experimental software)
    throw e;
  }
}

var PySerial = function () {
  function PySerial(params) {
    _classCallCheck(this, PySerial);

    this.type = "serial";
    this.params = params;
    this.ayt_pending = false;
    this.stream = new SerialPort(this.params.host, {
      baudRate: 115200,
      autoOpen: false
    }, function (err) {
      // not implemented
    });

    var dtr_support = ['darwin'];

    this.dtr_supported = dtr_support.indexOf(process.platform) > -1;
  }

  _createClass(PySerial, [{
    key: 'connect',
    value: function connect(onconnect, onerror, ontimeout) {

      var _this = this;
      var error_thrown = false;

      // open errors will be emitted as an error event
      this.stream.on('error', function (err) {
        if (!error_thrown) {
          error_thrown = true;
          onerror(new Error(err));
        }
      });

      var timeout = null;
      this.stream.open(function () {
        _this.send('\r\n', function () {
          clearTimeout(timeout);
          onconnect();
        });

        timeout = setTimeout(function () {
          ontimeout(new Error("Timeout while connecting"));
          _this.disconnect(function () {});
        }, _this.params.timeout);
      });
    }
  }, {
    key: 'disconnect',
    value: function disconnect(cb) {
      this.stream.close();
      cb();
    }
  }, {
    key: 'registerListener',
    value: function registerListener(cb) {
      var _this = this;
      this.onmessage = cb;
      this.stream.on('data', function (data) {
        data = data.toString();
        _this.onmessage(data);
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
      var _this = this;
      this.stream.write(data, function () {
        if (cb) {
          _this.stream.drain(cb);
        }
      });
    }
  }, {
    key: 'send_cmd',
    value: function send_cmd(cmd, cb) {
      var mssg = '\x1b\x1b' + cmd;
      data = new Buffer(mssg, "binary");
      this.send_raw(data, function () {
        // setTimeout(cb,400)
        cb();
      });
    }
  }, {
    key: 'sendPing',
    value: function sendPing() {
      // not implemented
      if (this.dtr_supported) {
        this.stream.set({ dtr: true });
      }
      return true;
    }
  }, {
    key: 'flush',
    value: function flush(cb) {
      this.stream.flush(cb);
    }
  }], [{
    key: 'isSerialPort',
    value: function isSerialPort(name, cb) {
      if (name && (name.substr(0, 3) == 'COM' || name.indexOf('tty') > -1 || name.indexOf('/dev') > -1)) {
        cb(true);
      } else {
        fs.access(name, fs.constants.F_OK, function (err) {
          if (err == true) {
            cb(true);
          } else {
            cb(false);
          }
        });
      }
    }
  }, {
    key: 'list',
    value: function list(cb) {
      SerialPort.list(function (err, ports) {
        var portnames = [];
        var other_portnames = [];
        for (var i = 0; i < ports.length; i++) {
          var manu = ports[i].manufacturer;
          if (COMPORT_MANUFACTURERS.indexOf(manu) > -1) {
            if (COMPORT_MANUFACTURERS[0] == manu) {
              portnames.unshift(ports[i].comName); // push to top of array
            } else {
              portnames.push(ports[i].comName);
            }
          } else {
            other_portnames.push(ports[i].comName);
          }
        }
        cb(portnames.concat(other_portnames));
      });
    }
  }]);

  return PySerial;
}();

exports.default = PySerial;