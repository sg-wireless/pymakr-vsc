"use strict";
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Config = function () {
  function Config() {
    _classCallCheck(this, Config);
  }

  _createClass(Config, null, [{
    key: "constants",
    value: function constants() {
      return {
        logging_level: 4, // 4 = error. anything higher than 5 = off. see logger.js
        max_sync_size: 350000,
        error_messages: {
          "EHOSTDOWN": "Host down",
          "EHOSTUNREACH": "Host unreachable",
          "ECONNREFUSED": "Connection refused",
          "ECONNRESET": " Connection was reset",
          "EPIPE": "Broken pipe"
        }
      };
    }
  }]);

  return Config;
}();

exports.default = Config;