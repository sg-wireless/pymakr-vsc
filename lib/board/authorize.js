'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Authorize = function () {
  function Authorize(pyboard) {
    _classCallCheck(this, Authorize);

    this.pyboard = pyboard;
    this.running = false;
    this.received_login_as = false;
  }

  _createClass(Authorize, [{
    key: 'run',
    value: function run(cb) {
      var pyboard = this.pyboard;
      var _this = this;
      this.running = true;

      if (pyboard.connection.type == 'telnet') {
        pyboard.wait_for_blocking("Login as:", function (err) {
          _this.received_login_as = true;
          if (err) {
            _this._stoppedRunning();
            if (err.message == "timeout") {
              cb(new Error("Login timed out"));
            } else {
              cb(new Error(err.message));
            }
          } else {
            pyboard.send_wait_for_blocking(pyboard.params.username, "Password:", function (err, mssg) {
              if (err && err.message == "timeout") {
                _this._stoppedRunning();
                cb(new Error("Username timed out"));
              } else {
                // timeout of 50 ms to be sure the board is ready to receive the password
                // Without this, sometimes connecting via the boards access point fails
                setTimeout(function () {
                  pyboard.send_wait_for_blocking(pyboard.params.password, 'Login succeeded!\r\nType "help()" for more information.\r\n', function (err, mssg) {
                    _this._stoppedRunning();
                    if (err && err.message == "timeout") {
                      cb("Password timed out");
                    } else {
                      cb(null);
                    }
                  }, 7000);
                }, 50);
              }
            }, 7000);
          }
        }, 7000);
      } else {
        cb('Telnet connection, no login needed');
        this.running = false;
      }
    }
  }, {
    key: '_stoppedRunning',
    value: function _stoppedRunning() {
      this.running = false;
      this.received_login_as = false;
    }
  }]);

  return Authorize;
}();

exports.default = Authorize;