
#  Pymakr VSC Package

Pymakr enables you to communicate to your Pycom board using the build in command line REPL. Run a single file to your board, sync your entire project or directly type and execute commands.

- Works with Mac OSX, Linux and windows.
- Connects to any Pycom board: WiPy, WiPy2.0, LoPy and any newer board.
- Works best with firmware 1.6.11.b1 and higher. Earlier firmware might have unexpected behaviour when synchronizing files over serial.

More info and documentation can be found on https://docs.pycom.io/

## Usage

The terminal will open by default after the package is installed. Use the 'Pymakr > Global settings' or 'Pymakr > Project settings' command to setup your connection. After changing the settings, use the 'Connect' command to connect using the new settings.

At any time, use the 'Pycom Console' button on the left bottom to toggle the terminal. When closing, the board is disconnected, indicated by the x icon in the button. When manually closing the terminal (x on the right top of the terminal) the connection stays active. Press the 'Pycom Console' button or use the 'Disconnect' command to close the connection.

## Commands

- Connect (ctrl-shift-c)         : Disconnects from the board
- Disconnect                     : Disconnects from the board
- Global settings (ctrl-shift-g) : Opens the installation-wide settings file
- Project Settings               : Opens project specific settings that overwrite global settings
- Run (ctrl-shift-r)             : Runs currently open file to the board
- Sync (ctrl-shift-s)            : Synchronizes the complete project to the board, using the sync folder settings
- List serial ports              : Lists all available serial ports and copies the first one to the clipboard
- Get board version              : Displays firmware version of the connected board
- Get WiFi SSID                  : Gets the SSID of the boards wifi accesspoint
- Help                           : Print this list of commands and settings

Useful keymaps:
- `ctrl-shift-c`: (Re)connect
- `ctrl-shift-g`: Global settings
- `ctrl-shift-s`: Synchronize project
- `ctrl-shiftt-r`: Run current file

## Settings

To connect to your board, use the 'Global settings' command to go to the extensions settings. Fill in the correct IP address or comport for your device. If you changed your username and password to something else than 'micro' and 'python', please update them accordingly if you connect over IP. Username and password are not required when using serial.

If you want to synchronize a subfolder of your project instead of the entire project, enter the name of the subfolder in the 'sync folder' field (for more info, see the Sync chapter below)

All possible settings (name : default : description):
- address           : 192.168.4.1         : IP address or comport for your device
- username          : micro               : Board username, only for telnet
- password          : python              : Board password, only for telnet
- sync_folder       : <empty>             : Folder to synchronize. Empty to sync projects main folder
- sync_file_types   : py,txt,log,json,xml : Type of files to be synchronized
- ctrl_c_on_connect : false               : If true, executes a ctrl-c on connect to stop running programs
- open_on_start     : true                : Weather to open the terminal and connect to the board when starting vsc
Any of these can be used inside the Project config to override the global config

## REPL

Using the REPL is easy and works the same way as your commandline based telnet or serial connection to your board. Type any micro-python command, use tab to auto-complete, arrow keys to go back in history and any of the following commands:
- `CTRL-B`: Enter friendly REPL
- `CTRL-C`: Stop any running code
- `CTRL-D`: Soft reset
- `CTRL-E`: Paste mode

Ctrl-C and Ctrl-V (or cmd-c/cmd-v on mac) can also be used to copy and paste in the console.

## Run

The 'Run' command will run the code from the currently open file to the connected board. Any print output or exceptions from this code will appear in the terminal. There is a shortcut button to the run command on the left bottom of the status bar.

## Sync

The 'sync' command will synchronize all files in your project to the board. Make sure you have a `main.py` and `boot.py` file in your project if you want to make sure your board will run properly. After synchronizing, the board will be reset. it might take a few moments to reconnect if you are using a telnet connection.

If you want to sync only a certain folder in your project, use the 'Sync folder' field in the settings and add the folder name.

By default, only the following file types are synchronized: py, txt, log, json and xml. This can be changed using the 'Sync file types' field in the settings.

The sync limit is set to 350kb. If your sync folder contains more than that, the plugin will refuse to sync.


## Common issues

### Synchronizing a project fails
Synchronizing takes a bit of memory, so this error can occur when code running on the board already is taking a substantial amount of memory.

Solution: Run the board in [safe mode](https://docs.pycom.io/pycom_esp32/pycom_esp32/toolsandfeatures.html#boot-modes-and-safe-boot) when synchronizing

# Developing
If you want to contribute to this project you can test the app the following way:

- Download the code or clone the repo
- Open the folder in vsc
- Press F1 and execute 'Tasks: Run build task' to run the babel builder
- Press F5 to run the plugin (opens a new vsc window)

## Release Notes

## 0.1.0 - Initial release
- All basic features working the same as Pymakr Atom v1.0.3
- Terminal implemented inside existing VSC terminal tab
- All features accessagle as commands as well as status bar buttons