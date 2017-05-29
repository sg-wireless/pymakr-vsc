'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logger = require('./logger.js');

var _logger2 = _interopRequireDefault(_logger);

var _apiWrapper = require('../api-wrapper.js');

var _apiWrapper2 = _interopRequireDefault(_apiWrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');


var EventEmitter = require('events');
var ee = new EventEmitter();

var Monitor = function () {
  function Monitor(pyboard, cb) {
    _classCallCheck(this, Monitor);

    this.logger = new _logger2.default('Monitor');
    this.pyboard = pyboard;
    this.disconnecting = false;
    this.callbacks = null;
    this.api = new _apiWrapper2.default();
    lib_folder = this.api.getPackageSrcPath();

    data = fs.readFileSync(lib_folder + 'board/python/monitor.py', 'utf8');
    connection_type_params = this.getScriptParams();
    data = connection_type_params + data;

    var _this = this;

    this.pyboard.enter_raw_repl_no_reset(function (err) {
      if (err) {
        cb(err);
        return;
      }
      _this.pyboard.exec_raw(data + "\r\n", function (err) {
        if (err) {
          cb(err);
          return;
        }
        // giving monitor.py a little time to setup
        setTimeout(function () {
          _this.setupChannel(cb);
        }, 600);
      });
    });
  }

  _createClass(Monitor, [{
    key: 'getScriptParams',
    value: function getScriptParams() {
      if (this.pyboard.isSerial) {
        return "connection_type = 'u'\nTIMEOUT = 5000\n";
      } else {
        var pass = this.api.config().get('Pymakr.password');
        var user = this.api.config().get('Pymakr.username');
        return "connection_type = 's'\ntelnet_login = ('" + pass + "', '" + user + "')\nTIMEOUT = 5000\n";
      }
    }
  }, {
    key: 'setupChannel',
    value: function setupChannel(cb) {
      this.disconnecting = false;
      if (this.pyboard.isSerial) {
        cb();
      } else {
        this.callbacks = this.pyboard.getCallbacks();
        this.pyboard.disconnect_silent();
        this.pyboard.connect_raw(cb, function (err) {

          if (!this.disconnecting) {
            cb(err);
          }
        }, function () {
          if (!this.disconnecting) {
            cb(new Error("timeout"));
          }
        }, function (mssg) {
          if (mssg.indexOf("ReadTimeout, exit monitor") > -1) {
            this.stopped(function () {
              cb(new Error("timeout"));
            });
          }
        });
      }
    }
  }, {
    key: 'removeFile',
    value: function removeFile(name, cb) {
      var _this = this;
      this.logger.info('Sending remove-file command for ' + name);
      this.pyboard.send_cmd('\x01\x02', function () {
        _this.logger.verbose('Sending 16 bit name length');
        _this.pyboard.send_raw(_this.int_16(name.length), function () {
          _this.logger.verbose('Sending name');
          _this.pyboard.send(name, function () {
            _this.requestAck(cb);
          });
        });
      });
    }
  }, {
    key: 'createDir',
    value: function createDir(name, cb) {
      var _this = this;
      this.logger.info('Seding create-dir command for ' + name);
      this.pyboard.send_cmd('\x01\x04', function () {
        _this.logger.verbose('Sending 16 bit name length');
        _this.pyboard.send_raw(_this.int_16(name.length), function () {
          _this.logger.verbose('Sending name');
          _this.pyboard.send(name, function () {
            _this.requestAck(cb);
          });
        });
      });
    }
  }, {
    key: 'removeDir',
    value: function removeDir(name, cb) {
      var _this = this;
      this.pyboard.send_cmd('\x01\x05', function () {
        // _this.pyboard.flush(function(){
        _this.pyboard.send_raw(_this.int_16(name.length), function () {
          // _this.pyboard.flush(function(){
          _this.pyboard.send(name, cb);
          // })
        });
        // })
      });
    }
  }, {
    key: 'reset',
    value: function reset(cb) {
      var _this = this;
      this.pyboard.send_cmd('\x00\xFE', function (err) {
        cb(err);
      }, 2000);
    }
  }, {
    key: 'send_exit',
    value: function send_exit(cb) {
      this.pyboard.send_cmd('\x00\xFF', function (err) {
        setTimeout(function (err) {
          cb(err);
        }, 400);
      }, 2000);
    }
  }, {
    key: 'stopped',
    value: function stopped(cb) {
      if (this.pyboard.connection.type != 'serial') {
        this.pyboard.disconnect_silent();
      }
    }
  }, {
    key: 'exit',
    value: function exit(cb) {
      var _this = this;
      this.disconnecting = true;

      this.reset(function (err) {
        _this.stopped();
        cb(err);
      });
    }
  }, {
    key: 'requestAck',
    value: function requestAck(cb) {
      this.pyboard.send_cmd_read('\x00\x00', 3, function (err) {
        if (err) {
          err = "Failed to confirm file transfer";
        }
        cb(err);
      }, 3000);
    }
  }, {
    key: 'writeFile',
    value: function writeFile(name, contents, cb) {
      var _this = this;
      this.logger.info('Seding write-file command for ' + name);
      this.pyboard.send_cmd('\x01\x00', function () {
        _this.logger.verbose('Sending 16 bit name length ');
        _this.pyboard.send_raw(_this.int_16(name.length), function () {
          setTimeout(function () {
            _this.logger.verbose('Sending name');
            _this.pyboard.send(name, function () {

              _this.requestAck(function (err) {
                if (err) {
                  cb(err);
                  return;
                }
                _this.logger.verbose('Sending 32 bit content length (' + contents.length + ")");
                _this.pyboard.send_raw(_this.int_32(contents.length), function () {
                  _this.pyboard.flush(function () {
                    _this._writeFileChunkRecursive(contents, 0, 256, cb);
                  });
                });
              }, 1000);
            });
          }, 100);
        });
      });
    }
  }, {
    key: '_writeFileChunkRecursive',
    value: function _writeFileChunkRecursive(content, block, blocksize, cb) {
      var _this = this;
      if (!block) {
        block = 0;
      }
      var block_start = block * blocksize;
      var chunk = content.substring(block_start, block_start + blocksize);
      if (chunk.length == 0) {
        _this.pyboard.flush(cb);
      } else {
        var binary_chunk = new Buffer(chunk, "binary");
        this.logger.verbose('Sending chunk ' + block + " of " + chunk.length);
        _this.pyboard.send_raw(binary_chunk, function () {
          setTimeout(function () {
            _this.logger.verbose('Requesting ack...');
            _this.requestAck(function (err) {
              _this.logger.verbose('Got an ack back, flushing..');
              if (err) {
                cb(err);
                return;
              }
              // _this.pyboard.flush(function(){
              _this._writeFileChunkRecursive(content, block + 1, blocksize, cb);
              // })
            });
          }, 100);
        });
      }
    }
  }, {
    key: 'readFile',
    value: function readFile(name, cb) {
      var _this = this;
      this.pyboard.send_cmd('\x01\x01', function () {
        _this.pyboard.send_raw(_this.int_16(name.length), function () {
          _this.pyboard.send_read(name, 4, function (err, number) {
            if (err) {
              cb(err);
              return;
            }
            var b = Buffer(number);
            number = b.readUInt32BE();
            if (number == 0) {
              cb(null, "");
            } else {
              _this.pyboard.read(number, function (err, content) {
                cb(err, content);
              }, 3000);
            }
          }, 2000);
        });
      });
    }
  }, {
    key: 'int_16',
    value: function int_16(int) {
      var b = new Buffer(2);
      b.writeUInt16BE(int);
      return b;
    }
  }, {
    key: 'int_32',
    value: function int_32(int) {
      var b = new Buffer(4);
      b.writeUInt32BE(int);
      return b;
    }
  }]);

  return Monitor;
}();

exports.default = Monitor;