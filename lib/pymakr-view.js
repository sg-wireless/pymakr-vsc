'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pyboard = require('./board/pyboard');

var _pyboard2 = _interopRequireDefault(_pyboard);

var _sync = require('./board/sync');

var _sync2 = _interopRequireDefault(_sync);

var _terminal = require('./board/terminal');

var _terminal2 = _interopRequireDefault(_terminal);

var _pyserial = require('./connections/pyserial');

var _pyserial2 = _interopRequireDefault(_pyserial);

var _apiWrapper = require('./api-wrapper.js');

var _apiWrapper2 = _interopRequireDefault(_apiWrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var vscode = require('vscode');

var fs = require('fs');
var ElementResize = require("element-resize-detector");

var PymakrView = function () {
  function PymakrView(serializedState, pyboard, settings) {
    _classCallCheck(this, PymakrView);

    var _this = this;
    this.pyboard = pyboard;
    this.visible = true;
    this.running_file = false;
    this.synchronizing = false;
    this.settings = settings;
    this.api = new _apiWrapper2.default();

    // // main element
    // this.element = document.createElement('div');
    // this.element.classList.add('pymakr');
    // this.element.classList.add('open');

    // this.resizer = document.createElement('div');
    // this.resizer.classList.add('resizer');
    // this.element.appendChild(this.resizer)

    // // top bar with buttons
    // var topbar = document.createElement('div');
    // topbar.classList.add('pycom-top-bar');
    // this.title = topbar.appendChild(document.createElement('div'));
    // this.title.classList.add('title');
    // this.title.innerHTML = 'Pycom Console (not connected)';

    // var buttons = topbar.appendChild(document.createElement('div'));
    // buttons.classList.add('buttons')
    // this.button_close = buttons.appendChild(document.createElement('button'));
    // this.button_close.innerHTML = '<span class="fa fa-chevron-down"></span> Close';
    // this.button_settings = buttons.appendChild(document.createElement('button'));
    // this.button_settings.innerHTML = '<span class="fa fa-cog"></span> Settings';
    // this.button_settings_sub = this.button_settings.appendChild(document.createElement('div'))
    // this.button_settings_sub.classList.add('subnav');
    // this.option_project_settings = this.button_settings_sub.appendChild(document.createElement('div'))
    // this.option_project_settings.innerHTML = 'Project settings';
    // this.option_global_settings = this.button_settings_sub.appendChild(document.createElement('div'))
    // this.option_global_settings.innerHTML = 'Global settings';

    // this.button_run = buttons.appendChild(document.createElement('button'));
    // this.button_run.innerHTML = 'Run';
    // this.button_run.classList.add('hidden');
    // this.button_sync = buttons.appendChild(document.createElement('button'));
    // this.button_sync.innerHTML = '<span class="fa fa-upload"></span> Sync';
    // this.button_sync.classList.add('hidden');
    // this.button_connect = buttons.appendChild(document.createElement('button'));
    // this.button_connect.innerHTML = '<span class="fa fa-exchange"></span> Connect';
    // this.button_more = buttons.appendChild(document.createElement('button'));
    // this.button_more.innerHTML = '<span class="fa down fa-chevron-down"></span><span class="fa up fa-chevron-up"></span> More';

    // this.button_more_sub = this.button_more.appendChild(document.createElement('div'))
    // this.button_more_sub.classList.add('subnav');
    // this.option_get_version = this.button_more_sub.appendChild(document.createElement('div'))
    // this.option_get_version.innerHTML = 'Get firmware version';
    // this.option_get_serial = this.button_more_sub.appendChild(document.createElement('div'))
    // this.option_get_serial.innerHTML = 'Get serial ports';


    // this.element.appendChild(topbar);

    // // All button actions
    // // var closed_using_button = false
    // this.button_close.onclick = function(){
    //   if(_this.visible){
    //     setTimeout(function(){
    //       _this.hidePanel()
    //       // closed_using_button = true
    //     },50)
    //   }
    // }
    // this.button_connect.onclick = function(){
    //   _this.connect()
    // }
    // this.button_run.onclick = function(){
    //   if(!_this.synchronizing){
    //     _this.run()
    //   }
    // }
    // this.button_sync.onclick = function(){
    //   if(!_this.synchronizing){
    //     _this.sync()
    //   }
    // }
    // this.button_more.onblur = function(){
    //   _this.button_more.classList.remove("open")
    // }
    // this.button_settings.onblur = function(){
    //   setTimeout(function(){
    //     _this.button_settings.classList.remove("open")
    //   },50)
    // }

    // this.button_more.onclick = function(){
    //   if(_this.button_more.classList.contains("open")){
    //     _this.button_more.classList.remove("open")
    //   }else{
    //     _this.button_more.classList.add("open")
    //   }
    // }
    // this.button_settings.onclick = function(){
    //   if(_this.button_settings.classList.contains("open")){
    //     _this.button_settings.classList.remove("open")
    //   }else{
    //     _this.button_settings.classList.add("open")
    //   }
    // }

    // this.option_global_settings.onclick = function(){
    //   _this.api.openSettings()


    // }

    // this.option_project_settings.onclick = function(){
    //   _this.settings.openProjectSettings(function(err){
    //     if(err){
    //       console.log(err)
    //     }
    //   })
    // }

    // this.option_get_version.onclick = function(){
    //   _this.pyboard.send("import os; os.uname().release\r\n")

    // }
    // this.option_get_serial.onclick = function(){
    //   _this.terminal.enter()

    //   Pyserial.list(function(list){
    //     _this.terminal.writeln("Found "+list.length+" serialport"+(list.length == 1 ? "" : "s"))
    //     for(var i=0;i<list.length;i++){
    //       var text = list[i]
    //       if(i==0){
    //         _this.api.writeToCipboard(text)
    //         text += " (copied to clipboard)"
    //       }
    //       _this.terminal.writeln(text)
    //     }
    //     if(_this.pyboard.connected){
    //       _this.terminal.writePrompt()
    //     }
    //   })
    // }

    // topbar.onclick = function(){
    //   if(!_this.visible){
    //     // TODO: the line doesn't work yet. Clicking 'button_close' also toggles, creating unwanted behaviour
    //     _this.showPanel()
    //   }
    // }

    // // terminal UI elements
    // this.terminal_el = document.createElement('div');
    // this.terminal_el.id = "terminal"
    // this.element.appendChild(this.terminal_el);

    // var erd = ElementResize();
    // erd.listenTo(this.terminal_el,function(element){
    //   if(_this.visible){
    //       _this.setPanelHeight()
    //   }
    // })

    // // 'click to connect' feature on complete terminal element
    // this.terminal_el.onclick = function(){
    //   if(!_this.pyboard.connected && !_this.pyboard.connecting) {
    //     _this.connect()
    //   }
    // }

    // // terminal logic
    var onTermConnect = function onTermConnect() {
      _this.connect();
    };
    var term = new _terminal2.default(onTermConnect, this.pyboard);
    // term.initResize(_this.element,_this.resizer)
    this.terminal = term;
    term.setOnMessageListener(function (input) {
      _this.userInput(input);
    });

    this.pyboard.registerStatusListener(function (status) {
      if (status == 3) {
        _this.terminal.enter();
      }
    });

    // connect on start


    // hide panel if it was hidden after last shutdown of atom
    if (serializedState && 'visible' in serializedState) {
      if (!serializedState.visible) {
        this.hidePanel();
      }
    }

    // this.settings.on('format_error',function(){
    //   _this.terminal.writeln("JSON format error in pymakr.conf file")
    //   if(_this.pyboard.connected){
    //     _this.terminal.writePrompt()
    //   }
    // })
  }

  // called when user typed a command in the terminal


  _createClass(PymakrView, [{
    key: 'userInput',
    value: function userInput(input) {
      var _this = this;
      // this.terminal.write('\r\n')
      if (input != undefined) {
        this.pyboard.send_user_input(input, function (err) {
          if (err && err.message == 'timeout') {
            _this.disconnect();
          }
        });
      }
    }
  }, {
    key: 'openProjectSettings',
    value: function openProjectSettings() {
      this.settings.openProjectSettings(function (err) {
        if (err) {
          console.log(err);
          _this.terminal.writeln(err.message);
          if (_this.pyboard.connected) {
            _this.terminal.writePrompt();
          }
        }
      });
    }
  }, {
    key: 'openGlobalSettings',
    value: function openGlobalSettings() {
      this.api.openSettings();
    }

    // refresh button display based on current status

  }, {
    key: 'setButtonState',
    value: function setButtonState() {
      if (!this.visible) {
        // this.button_sync.classList.add('hidden')
        // this.button_run.classList.add('hidden')
        // this.button_connect.classList.add('hidden')
        // this.button_settings.classList.add('hidden')
        // this.button_more.classList.add('hidden')
        this.setTitle('not connected');
      } else if (this.pyboard.connected) {
        if (this.running_file) {
          // this.button_run.innerHTML = 'Cancel'
          // this.button_run.classList.add('cancel')
          // this.button_sync.classList = ['']
          // this.button_sync.classList.add('hidden')
        } else {}
          // this.button_run.innerHTML = '<span class="fa fa-play"></span> Run'
          // this.button_run.classList = ['']
          // this.button_sync.classList = ['']

          // this.button_connect.innerHTML = '<span class="fa fa-refresh"></span> Reconnect'
          // this.button_settings.classList = ['']
          // this.button_more.classList = ['']
        this.setTitle('connected');
      } else {
        // this.button_connect.classList = ['']
        // this.button_connect.innerHTML = '<span class="fa fa-exchange"></span> Connect'
        // this.button_run.classList.add('hidden')
        // this.button_sync.classList.add('hidden')
        // this.button_more.classList = ['']
        // this.button_settings.classList = ['']
        this.setTitle('not connected');
      }
    }
  }, {
    key: 'setTitle',
    value: function setTitle(status) {
      // this.title.innerHTML = 'Pycom Console ('+status+')'
    }
  }, {
    key: 'connect',
    value: function connect() {
      var _this = this;

      var continueConnect = function continueConnect() {
        _this.pyboard.refreshConfig();
        var address = _this.pyboard.params.host;
        if (address == "" || address == null) {
          _this.terminal.writeln("Address not configured. Please go to the settings to configure a valid address or comport");
        } else {
          _this.terminal.writeln("Connecting on " + address + "...");

          var onconnect = function onconnect(err) {

            if (err) {
              _this.terminal.writeln("Connection error: " + err);
            } else {
              // TODO: make this line appear in the terminal before the first messages from the board arrive (>>> in most cases)
              // _this.terminal.writeln("Connected via "+_this.pyboard.connection.type+"\r\n")
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
            if (!_this.synchronizing) {
              _this.terminal.write(mssg);
            }
          };

          _this.pyboard.connect(onconnect, onerror, ontimeout, onmessage);
        }
      };

      // stop config observer from triggering again
      clearTimeout(this.observeTimeout);
      if (this.pyboard.connected || this.pyboard.connecting) {
        this.disconnect(continueConnect);
      } else {
        continueConnect();
      }
    }
  }, {
    key: 'disconnect',
    value: function disconnect(cb) {
      if (this.pyboard.isConnecting()) {
        this.terminal.writeln("Canceled");
      } else {
        this.terminal.writeln("Disconnected. Click here to reconnect.");
      }
      this.pyboard.disconnect(cb);
      this.term_buffer = "";
      this.synchronizing = false;
      this.running_file = false;
      this.setButtonState();
    }
  }, {
    key: 'run',
    value: function run() {
      var _this = this;
      if (this.running_file) {
        console.log("Stop running now");
        this.pyboard.stop_running_programs_nofollow(function () {
          _this.pyboard.flush(function () {
            _this.pyboard.enter_friendly_repl(function () {});
            _this.running_file = false;
            _this.setButtonState();
          });
        });
      } else {
        console.log("Getting current file");
        this.api.getCurrentFile(function (fileContents, filename) {
          _this.terminal.writeln("Running " + filename);
          _this.running_file = true;
          _this.setButtonState();
          _this.pyboard.run(fileContents, function () {
            _this.running_file = false;
            _this.setButtonState();
          });
        }, function onerror(err) {
          _this.terminal.writeln_and_prompt(err);
        });
      }
    }
  }, {
    key: 'sync',
    value: function sync() {
      console.log("Started sync method");
      console.log(this.settings);
      console.log(this.settings.sync_folder);
      var sync_folder = this.settings.sync_folder;
      console.log(sync_folder);
      var folder_name = sync_folder == "" ? "main folder" : sync_folder;

      console.log("Sync object " + folder_name);
      this.syncObj = new _sync2.default(this.pyboard);
      console.log("Created done");

      var _this = this;

      console.log("Terminal enter");
      this.terminal.enter();
      console.log("Terminal enter done");

      // check if there is a project open
      if (!this.syncObj.project_path) {
        console.log("No project path");
        this.terminal.write("No project open\r\n");
        return;
      }
      // check if project exists
      if (!this.syncObj.exists(sync_folder)) {
        console.log("Folder doesn't exist");
        this.terminal.write("Unable to find folder '" + folder_name + "'. Please add the correct folder in your settings\r\n");
        return;
      }

      // start sync
      console.log("Sync to true");
      this.terminal.write("Syncing project (" + folder_name + ")...\r\n");
      this.synchronizing = true;
      console.log("Sync set to true");

      // called after sync is completed
      var oncomplete = function oncomplete(err) {

        if (err) {
          _this.terminal.writeln("Synchronizing failed: " + err.message + ". Please reboot your device manually.");
          if (_this.pyboard.type != 'serial') {
            _this.connect();
          }
          _this.synchronizing = false;
          _this.pyboard.stopWaitingForSilent();
          _this.setButtonState();
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

      console.log("oncomplete defined");

      // called every time the sync starts writing a new file or folder
      var onprogress = function onprogress(text) {
        _this.terminal.writeln(text);
      };

      console.log("onprogress defined");

      console.log("Starting sync");
      _this.syncObj.start(sync_folder, oncomplete, onprogress);
    }

    // UI Stuff

  }, {
    key: 'addPanel',
    value: function addPanel() {
      this.api.addBottomPanel({
        item: this.getElement(),
        visible: true,
        priority: 100
      });
    }
  }, {
    key: 'setPanelHeight',
    value: function setPanelHeight(height) {
      if (!height) {
        height = this.terminal_el.offsetHeight + 25;
      }
      this.element.style.height = height + "px";
    }
  }, {
    key: 'hidePanel',
    value: function hidePanel() {
      this.setPanelHeight(25); // 25px displays only the top bar
      this.button_close.innerHTML = '<span class="fa fa-chevron-up"></span> Open';
      this.element.classList.remove("open");
      this.visible = false;
      this.disconnect();
    }
  }, {
    key: 'showPanel',
    value: function showPanel() {
      this.terminal.clear();
      this.setPanelHeight(); // no param wil make it auto calculate based on xterm height
      this.button_close.innerHTML = '<span class="fa fa-chevron-down"></span> Close';
      this.element.classList.add("open");
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