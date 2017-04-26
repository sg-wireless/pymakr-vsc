'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

// require('../node_modules/xterm/dist/addons/fit/fit.js');

var vscode = require('vscode');

var _pyboard = require('./board/pyboard');

var _pyboard2 = _interopRequireDefault(_pyboard);

var _sync = require('./board/sync');

var _sync2 = _interopRequireDefault(_sync);

var _terminal = require('./board/terminal');

var _terminal2 = _interopRequireDefault(_terminal);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var ElementResize = require("element-resize-detector");

var PymakrView = function () {
  function PymakrView(serializedState, pyboard) {
    _classCallCheck(this, PymakrView);
    console.log("Constructor called");
    var _this = this;
    this.pyboard = pyboard;
    this.visible = true;
    this.running_file = false;
    this.synchronizing = false;

    // var document={}

    // // main element
    // this.element = document.createElement('div');
    // this.element.classList.add('pymakr');

    // // top bar with buttons
    // var topbar = document.createElement('div');
    // topbar.classList.add('pycom-top-bar');
    // this.title = topbar.appendChild(document.createElement('div'));
    // this.title.classList.add('title');
    // this.title.innerHTML = 'Pycom Console (not connected)';

    // var buttons = topbar.appendChild(document.createElement('div'));
    // buttons.classList.add('buttons');
    // this.button_close = buttons.appendChild(document.createElement('button'));
    // this.button_close.innerHTML = 'Close';
    // this.button_settings = buttons.appendChild(document.createElement('button'));
    // this.button_settings.innerHTML = 'Settings';
    // this.button_run = buttons.appendChild(document.createElement('button'));
    // this.button_run.innerHTML = 'Run';
    // this.button_run.classList.add('hidden');
    // this.button_sync = buttons.appendChild(document.createElement('button'));
    // this.button_sync.innerHTML = 'Sync';
    // this.button_sync.classList.add('hidden');
    // this.button_connect = buttons.appendChild(document.createElement('button'));
    // this.button_connect.innerHTML = 'Connect';
    // this.button_more = buttons.appendChild(document.createElement('button'));
    // this.button_more.innerHTML = 'more';

    // this.element.appendChild(topbar);

    // // All button actions
    // this.button_close.onclick = function () {
    //   _this.toggleVisibility();
    // };
    // this.button_connect.onclick = function () {
    //   _this.connect();
    // };
    // this.button_run.onclick = function () {
    //   if (!_this.synchronizing) {
    //     _this.run();
    //   }
    // };
    // this.button_sync.onclick = function () {
    //   if (!_this.synchronizing) {
    //     _this.sync();
    //   }
    // };
    // topbar.onclick = function () {
    //   if (!_this.visible) {
    //     // TODO: the line doesn't work yet. Clicking 'button_close' also toggles, creating unwanted behaviour
    //     // _this.toggleVisibility()
    //   }
    // };

    // this.button_settings.onclick = function () {
    //   // atom.workspace.open("atom://config/packages/Pymakr");
    // };

    // // terminal UI elements
    // this.terminal_el = document.createElement('div');
    // this.terminal_el.id = "terminal";
    // this.element.appendChild(this.terminal_el);

    // var erd = ElementResize();
    // erd.listenTo(this.terminal_el, function (element) {
    //   if (_this.visible) {
    //     _this.setPanelHeight();
    //   }
    // });

    // // 'click to connect' feature on complete terminal element
    // this.terminal_el.onclick = function () {
    //   if (!_this.pyboard.connected && !_this.pyboard.connecting) {
    //     _this.connect();
    //   }
    // };

    // terminal logic
    var term = new _terminal2.default(null, this.pyboard);
    this.terminal = term;
    term.setOnMessageListener(function (input) {
      _this.userInput(input);
    });

    // Auto-reconnect after change of settings
    var first_trigger = true;
    this.observeTimeout = null;
    // atom.config.observe('pymakr.host', function () {

    //   // use timeout to not attempt connecting after each keystroke
    //   clearTimeout(this.observeTimeout);
    //   this.observeTimeout = setTimeout(function () {

    //     // callback triggers when loading, so filder out first trigger
    //     if (first_trigger) {
    //       first_trigger = false;
    //     } else {
    //       _this.connect();
    //     }
    //   }, 2000);
    // });

    // connect on start
    this.connect();

    // hide panel if it was hidden after last shutdown of atom
    if (serializedState && 'visible' in serializedState) {
      if (!serializedState.visible) {
        this.hidePanel();
      }
    }
  }

  // called when user typed a command in the terminal


  _createClass(PymakrView, [{
    key: 'userInput',
    value: function userInput(input) {
      var _this = this;
      // this.terminal.write('\r\n')
      this.pyboard.send_user_input(input, function (err) {
        if (err && err.message == 'timeout') {
          _this.disconnect();
        }
      });
    }

    // refresh button display based on current status

  }, {
    key: 'setButtonState',
    value: function setButtonState() {
      if (!this.visible) {
        // this.button_sync.classList.add('hidden');
        // this.button_run.classList.add('hidden');
        // this.button_connect.classList.add('hidden');
        // this.button_settings.classList.add('hidden');
        this.setTitle('not connected');
      } else if (this.pyboard.connected) {
        if (this.running_file) {
          // this.button_run.innerHTML = 'Cancel';
          // this.button_run.classList.add('cancel');
          // this.button_sync.classList = [''];
          // this.button_sync.classList.add('hidden');
        } else {}
          // this.button_run.innerHTML = 'Run';
          // this.button_run.classList = [''];
          // this.button_sync.classList = [''];

          // this.button_connect.innerHTML = 'Reconnect';
          // this.button_settings.classList = [''];
        this.setTitle('connected');
      } else {
        // this.button_connect.classList = [''];
        // this.button_connect.innerHTML = 'Connect';
        // this.button_run.classList.add('hidden');
        // this.button_sync.classList.add('hidden');
        // this.button_settings.classList = [''];
        this.setTitle('not connected');
      }
    }
  }, {
    key: 'setTitle',
    value: function setTitle(status) {
      // this.title.innerHTML = 'Pycom Console (' + status + ')';
    }
  }, {
    key: 'connect',
    value: function connect() {
      var _this = this;

      // stop config observer from triggering again
      clearTimeout(this.observeTimeout);
      if (this.pyboard.connected || this.pyboard.connecting) {
        this.disconnect();
      }

      this.pyboard.refreshConfig();
      var address = this.pyboard.params.host;
      if (address == "" || address == null) {
        this.terminal.writeln("Address not configured. Please go to the settings to configure a valid address or comport");
      } else {
        this.terminal.writeln("Connecting on " + address + "...");

        var onconnect = function onconnect(err) {

          if (err) {
            _this.terminal.writeln("Connection error: " + err);
          } else {
            // TODO: make this line appear in the terminal before the first messages from the board arrive (>>> in most cases)
            // _this.terminal.writeln("Connected via "+_this.pyboard.connection.type+"\r\n")
            vscode.window.showInputBox({ prompt: 'Type your command' }).then(val => _this.userInput(val + "\r\n"));
          }
          _this.setButtonState();
        };

        var onerror = function onerror(err) {
          var message = _this.pyboard.getErrorMessage(err.message);
          if (message == "") {
            message = err.message ? err.message : "Unknown error";
          }
          _this.terminal.writeln("> Failed to connect (" + message + "). Click here to try again.");
          _this.setButtonState();
        };

        var ontimeout = function ontimeout(err) {
          _this.terminal.writeln("> Connection timed out. Click here to try again.");
          _this.setButtonState();
        };

        var onmessage = function onmessage(mssg) {
          _this.terminal.write(mssg);
        };

        this.pyboard.connect(onconnect, onerror, ontimeout, onmessage);
      }
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      if (this.pyboard.isConnecting()) {
        this.terminal.writeln("Canceled");
      } else {
        this.terminal.writeln("Disconnected. Click here to reconnect.");
      }
      this.pyboard.disconnect();
      this.term_buffer = "";
      this.setButtonState();
    }
  }, {
    key: 'run',
    value: function run() {
      var _this = this;
      if (this.running_file) {

        this.pyboard.stop_running_programs_nofollow(function () {
          _this.pyboard.flush(function () {
            _this.pyboard.enter_friendly_repl(function () {});
            _this.running_file = false;
            _this.setButtonState();
          });
        });
      } else {

        this.getCurrentFile(function (file) {
          _this.terminal.writeln("Running " + filename);
          _this.running_file = true;
          _this.setButtonState();
          _this.pyboard.run(file.cachedContents, function () {
            _this.running_file = false;
            _this.setButtonState();
          });
        }, function onerror(err) {
          this.terminal.writeln_and_prompt(err);
        });
      }
    }
  }, {
    key: 'sync',
    value: function sync() {
      var _this = this;

      var sync_folder = ""; //atom.config.get('Pymakr.sync_folder');
      var folder_name = sync_folder == "" ? "main folder" : sync_folder;

      this.syncObj = new _sync2.default(this.pyboard);

      // check if there is a project open
      if (!this.syncObj.project_path) {
        this.terminal.write("No project open\r\n");
        return;
      }
      // check if project exists
      if (!this.syncObj.exists(sync_folder)) {
        this.terminal.write("Unable to find folder '" + folder_name + "'. Please add the correct folder in your settings\r\n");
        return;
      }

      // start sync
      this.terminal.write("Syncing project (" + folder_name + ")...\r\n");
      this.synchronizing = true;

      // called after sync is completed
      var oncomplete = function oncomplete(err) {

        if (err) {
          _this.terminal.writeln("Synchronizing failed: " + err.message + ". Please reboot your device manually.");
          if (_this.pyboard.type != 'serial') {
            _this.connect();
          }
          _this.synchronizing = false;
        } else {
          _this.terminal.writeln("Synchronizing done, resetting board...");
          _this.setButtonState();

          // on telnet/socket, we need to give the board some time to reset the connection
          if (_this.pyboard.type != 'serial') {
            setTimeout(function () {
              _this.connect();
              _this.synchronizing = false;
            }, 2000);
          } else {
            _this.synchronizing = false;
          }
        }
      };

      // called every time the sync starts writing a new file or folder
      var onprogress = function onprogress(text) {
        _this.terminal.writeln(text);
      };

      this.syncObj.start(sync_folder, oncomplete, onprogress);
    }
  }, {
    key: 'getCurrentFile',
    value: function getCurrentFile(cb, onerror) {
      editor = null; //atom.workspace.getActivePaneItem();
      if (editor && editor.buffer) {
        file = editor.buffer.file;
        if (file) {
          filename = file.path.split('/').pop(-1);
          filetype = filename.split('.').pop(-1);
          if (filetype == 'py') {
            cb(file);
          } else {
            onerror("Can't run " + filetype + " files, please run only python files");
          }
        } else {
          onerror("No file open to run");
        }
      } else {
        onerror("No file open to run");
      }
    }

    // UI Stuff

  }, {
    key: 'addPanel',
    value: function addPanel() {
      // atom.workspace.addBottomPanel({
      //   item: this.getElement(),
      //   visible: true,
      //   priority: 100
      // });
    }
  }, {
    key: 'setPanelHeight',
    value: function setPanelHeight(height) {
      // if (!height) {
      // height = this.terminal_el.offsetHeight + 25;
      // }
      // this.element.style.height = height + "px";
    }
  }, {
    key: 'hidePanel',
    value: function hidePanel() {
      this.setPanelHeight(25); // 25px displays only the top bar
      // this.button_close.innerHTML = 'Open';
      this.visible = false;
      this.disconnect();
    }
  }, {
    key: 'showPanel',
    value: function showPanel() {
      this.terminal.clear();
      this.setPanelHeight(); // no param wil make it auto calculate based on xterm height
      // this.button_close.innerHTML = 'Close';
      this.visible = true;
      this.setButtonState();
      this.connect();
    }
  }, {
    key: 'toggleVisibility',
    value: function toggleVisibility() {
      this.visible ? this.hidePanel() : this.showPanel();
    }

    // Returns an object that can be retrieved when package is activated

  }, {
    key: 'serialize',
    value: function serialize() {
      return { visible: this.visible };
    }

    // Tear down any state and detach

  }, {
    key: 'destroy',
    value: function destroy() {
      this.disconnect();
      this.element.remove();
    }
  }, {
    key: 'getElement',
    value: function getElement() {
      return this.element;
    }
  }]);

  return PymakrView;
}();

exports.default = PymakrView;
