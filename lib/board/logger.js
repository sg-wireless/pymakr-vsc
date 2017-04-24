'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('../config.js');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LOG_LEVEL = _config2.default.constants().logging_level;
var LEVELS = ['silly', 'verbose', 'info', 'warning', 'error', 'critical'];

// Import this class and create a new logger object in the constructor, providing
// the class name. Use the logger anywhere in the code
// this.logger = new Logger('Pyboard')
// this.logger.warning("Syncing to outdated firmware")
// Result in the console will be:
// [warning] Pyboard | Syncing to outdated firmware

var Logger = function () {
  function Logger(classname) {
    _classCallCheck(this, Logger);

    this.classname = classname;
  }

  _createClass(Logger, [{
    key: 'log',
    value: function log(level, mssg) {
      if (level >= LOG_LEVEL) {
        console.log("[" + LEVELS[level] + "] " + this.classname + " | " + mssg);
      }
    }
  }, {
    key: 'silly',
    value: function silly(mssg) {
      this.log(0, mssg);
    }
  }, {
    key: 'verbose',
    value: function verbose(mssg) {
      this.log(1, mssg);
    }
  }, {
    key: 'info',
    value: function info(mssg) {
      this.log(2, mssg);
    }
  }, {
    key: 'warning',
    value: function warning(mssg) {
      this.log(3, mssg);
    }
  }, {
    key: 'error',
    value: function error(mssg) {
      this.log(4, mssg);
    }
  }, {
    key: 'critical',
    value: function critical(mssg) {
      this.log(5, mssg);
    }
  }]);

  return Logger;
}();

exports.default = Logger;