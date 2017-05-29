'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pyboard = require('./board/pyboard');

var _pyboard2 = _interopRequireDefault(_pyboard);

var _pymakrView = require('./pymakr-view');

var _pymakrView2 = _interopRequireDefault(_pymakrView);

var _atom = require('atom');

var _config = require('./config.js');

var _config2 = _interopRequireDefault(_config);

var _settingsWrapper = require('./settings-wrapper');

var _settingsWrapper2 = _interopRequireDefault(_settingsWrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  config: _config2.default.settings(),

  activate: function activate(state) {
    var _this = this;

    this.settings = new _settingsWrapper2.default();
    this.pyboard = new _pyboard2.default(this.settings);
    this.view = new _pymakrView2.default(state.viewState, this.pyboard, this.settings);
    this.view.addPanel();

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new _atom.CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pymakr:sync': function pymakrSync() {
        return _this.view.sync();
      },
      'pymakr:toggleREPL': function pymakrToggleREPL() {
        return _this.view.toggleVisibility();
      },
      'pymakr:connect': function pymakrConnect() {
        return _this.view.connect();
      },
      'pymakr:run': function pymakrRun() {
        return _this.view.run();
      }
    }));
  },
  deactivate: function deactivate() {
    this.subscriptions.dispose();
    this.view.destroy();
  },
  serialize: function serialize() {
    return {
      viewState: this.view.serialize()
    };
  }
};