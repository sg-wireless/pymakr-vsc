'use babel';

export default class Config {
  static constants(){
    return {
      logging_level: 4, // 4 = error. anything higher than 5 = off. see logger.js
      max_sync_size: 350000,
      error_messages: {
        "EHOSTDOWN": "Host down",
        "EHOSTUNREACH": "Host unreachable",
        "ECONNREFUSED": "Connection refused",
        "ECONNRESET":" Connection was reset",
        "EPIPE": "Broken pipe",
        "MemoryError": "Not enough memory available on the board."
      },
      help_text: "Pymakr VSC Plugin Help. Commands to use (cmd/ctrl + p):\r\n"
              +  "- Disconnect        : Disconnects from the board\r\n"
              +  "- Global settings   : Opens the installation-wide settings file\r\n"
              +  "- Project Settings  : Opens project specific settings that overwrite global settings\r\n"
              +  "- Run               : Runs currently open file to the board\r\n"
              +  "- Sync              : Synchronizes the complete project to the board, using the sync folder settings\r\n"
              +  "- List serial ports : Lists all available serial ports and copies the first one to the clipboard\r\n"
              +  "- Get board version : Displays firmware version of the connected board\r\n"
              +  "- Get WiFi SSID     : Gets the SSID of the boards wifi accesspoint\r\n"
              +  "\r\n"
              +  "Settings (name : default : description):\r\n"
              +  "- address           : 192.168.4.1         : IP address or comport for your device\r\n"
              +  "- username          : micro               : Boards username, only for telnet\r\n"
              +  "- password          : python              : Boards password, only for telnet\r\n"
              +  "- sync_folder       : <empty>             : Folder to synchronize. Empty to sync projects main folder\r\n"
              +  "- sync_file_types   : py,txt,log,json,xml : Type of files to be synchronized\r\n"
              +  "- ctrl_c_on_connect : false               : If true, executes a ctrl-c on connect to stop running programs\r\n"
              +  "- open_on_start     : true                : Weather to open the terminal and connect to the board when starting vsc\r\n"
              +  "Any of these can be used inside the Project config to override the global config\r\n"
              +  "\r\n"
              +  "For more information, check github.com/pycom/pymakr-vsc or docs.pycom.io\r\n"
              +  "\r\n",

      start_text: "Welcome to the Pymakr plugin! Use the buttons on the left bottom to access all features and commands.\r\n"
              +  "This is how you get started:\r\n"
              +  " 1: Open 'Global Settings' (we went ahead and did that for you)\r\n"
              +  " 2: Fill in the correct IP or serial port of your Pycom board in 'address'\r\n"
              +  "     (When using serial, use the 'List serial ports' to find the correct serial port)\r\n"
              +  " 3: Connect using the 'Connect' command or the 'Pycom Console' button\r\n"
              +  " 4: Open a micropython project with main.py and boot.py files\r\n"
              +  " 5: Start running files and synchronizing your project \r\n"
              +  "\r\n"
              +  " Use the 'Help' command for more info about all the options \r\n"
    }
  }

  static settings(){
    return {
      address: {
          type: 'string',
          default: '192.168.4.1',
          title: 'Device address',
          description: 'Either connect through USB serial using a comport (for example /dev/cu.usbserial-DQ00573Z) or an IP address for a telnet connection. Username and password are not needed for serial connections.',
          order: 1
      },
      username: {
          type: 'string',
          default: 'micro',
          title: 'User name',
          order: 2
      },
      password: {
          type: 'string',
          default: 'python',
          title: 'Password',
          order: 3
      },
      ctrl_c_on_connect: {
          type: 'boolean',
          default: false,
          title: 'Ctrl-c on connect',
          description: 'Stops all running programs when connecting to the board',
          order: 4
      },
      sync_folder: {
          type: 'string',
          default: "",
          title: 'Sync Folder',
          description: 'This folder will be uploaded to the pyboard when using the sync button. Leave empty to sync the complete project. (only allows folders within the project)',
          order: 5
      },
      sync_file_types: {
          type: 'string',
          default: "py,txt,log,json,xml",
          title: 'Sync file types',
          description: 'All types of files that will be synced to the board, seperated by comma. All other filetypes will be ignored during a sync action',
          order: 6
      }, 
      open_on_start: {
          type: 'boolean',
          default: true,
          title: 'Open on start',
          description: 'Open the pymakr console and connect to the board after starting the editor or opening a project',
          order: 6
      },
    }
  }
}

// other error codes that possibly need intergration
// EINTR Interrupted system
// EIO I/O error
// EFAULT Bad address
// EBUSY Mount device busy
// ENODEV No such device
// ENOTTY Not a typewriter
// EPIPE Broken pipe
// EALREADY Operation already in progress
// ETIMEDOUT Connection timed out
// ECONNREFUSED Connection refused
// ECONNRESET Connection reset by peer
// EISCONN Socket is already connected
// ECOMM Communication error
// EIBMCONFLICT Conflicting call already outstanding on socket
