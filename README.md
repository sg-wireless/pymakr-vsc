#  Pymakr VSC Package

Pymakr enables you to communicate to your Pycom board using the build in command line REPL. Run a single file to your board, sync your entire project or directly type and execute commands.

- Works with macOS, Linux, and Windows.
- Connects to any Pycom board: WiPy, WiPy 2.0, LoPy, and any newer board.
- Works best with firmware `1.6.11.b1` and higher. Earlier firmware might have unexpected behaviour when synchronizing files over serial.

More info and documentation can be found on [docs.pycom.io](https://docs.pycom.io)


## Dependencies
- **NodeJS installed on your system (6.9.5 or higher)** https://nodejs.org

## Usage

The terminal will open by default after the package is installed. Use the `Pymakr > Global settings` or `Pymakr > Project settings` command to setup your connection. After changing the settings, use the `Connect` command to connect using the new settings.

At any time, use the `Pycom Console` button on the left bottom to toggle the terminal. When closing, the board is disconnected, indicated by the `x` icon in the button. When manually closing the terminal (`x` on the right top of the terminal) the connection stays active. Press the `Pycom Console` button or use the `Disconnect` command to close the connection.

## Commands

- Connect (ctrl-shift-c)           : Connects to the board
- Disconnect                       : Disconnects from the board
- Global settings (ctrl-shift-g)   : Opens the installation-wide settings file
- Project Settings                 : Opens project specific settings that overwrite global settings
- Run (ctrl-shift-r)               : Runs currently open file on the board ()
- Run selection (ctrl-shift-enter) : Rns the current selected line on the board
- Sync (ctrl-shift-s)              : Synchronizes the complete project to the board, using the sync folder settings
- List serial ports                : Lists all available serial ports and copies the first one to the clipboard
- Get board version                : Displays firmware version of the connected board
- Get WiFi SSID                    : Gets the SSID of the boards WiFi access point
- Help                             : Print this list of commands and settings

Useful keymaps:
- `ctrl-shift-c`     : (Re)connect
- `ctrl-shift-g`     : Global settings
- `ctrl-shift-s`     : Synchronize project
- `ctrl-shift-r`     : Run current file
- `ctrl-shift-enter` : Run current Line

## Settings

To connect to your board, use the `Global settings` command to go to the extensions settings. Fill in the correct IP address or comport for your device. If you changed your username and password to something else than `micro` and `python`, please update them accordingly if you connect over IP. Username and password are not required when using serial.

If you want to synchronize a subfolder of your project instead of the entire project, enter the name of the subfolder in the 'sync folder' field (for more info, see the Sync chapter below)

Please refer to [Settings](settings.md) for a list of all the settings.

## REPL

Using the REPL is easy and works the same way as your command line based telnet or serial connection to your board. Type any micro-python command, use tab to auto-complete, arrow keys to go back in history and any of the following commands:
- `CTRL-B`: Enter friendly REPL
- `CTRL-C`: Stop any running code
- `CTRL-D`: Soft reset
- `CTRL-E`: Paste mode
- `CTRL-F`: Safe boot (on supported pycom boards) 

Ctrl-C and Ctrl-V (or cmd-c/cmd-v on mac) can also be used to copy and paste in the console.

## Run

The `Run` command will run the code from the currently open file to the connected board. Any print output or exceptions from this code will appear in the terminal. There is a shortcut button to the run command on the left bottom of the status bar.

## Run Selection

The `Run Selection` command will run the code on the current line in the active editor, to the connected board using paste-mode. If a block of code is selected, it will run the (first) selected block.

This can be used to step though your code on a line-by-line basis, and allows you to inspect and debug your code.

If the selected line of block of code is idented, as is often the case, it will be de-idented based on the first selected line. so if the first selected line is idented with 8 spaces, all lines will have 8 leading spaces removed.
If you have lines with irregular identing, these lines will be trimmed, and a warning comment added.

As Paste-Mode is used, you will see both your code , as well as the output in the terminal.

## Sync

The `sync` command will synchronize all files in your project to the board. Make sure you have a `main.py` and `boot.py` file in your project if you want to make sure your board will run properly. After synchronizing, the board will be reset. it might take a few moments to reconnect if you are using a telnet connection.

If you want to sync only a certain folder in your project, use the 'Sync folder' field in the settings and add the folder name.

By default, only the following file types are synchronized: `py, txt, log, json, xml`. This can be changed using the `Sync file types` field in the settings.

The sync limit is set to 350kb. If your sync folder contains more than that, the plugin will refuse to sync.

## Common issues

### Synchronizing a project fails
Synchronizing takes a bit of memory, so this error can occur when code running on the board already is taking a substantial amount of memory.

**Solution:** use safe boot with [REPL](https://docs.pycom.io/gettingstarted/programming/repl) or [Expansion Board](https://docs.pycom.io/product-info/boards/expansion3) when synchronizing

### Terminal not opening
If the Pymakr terminal is not opening or giving an error, this might be because NodeJS is not installed on your system. This is because the terminal process is running separate from VSCode and depends on your systems NodeJS install.

**Solution:** Install NodeJS. For windows 64 machines, install a 32 bit version of nodejs (for example `nvm install 7.8.0 32` when using nvm).


### Cannot connect to Pycom device on Linux

If you're a linux user and can't connect to your board, there might be a permission issue to access the serial port.

**Solution:** Run the following command `sudo usermod -a -G dialout $USER`

### My board is not autodetected.

This may be the case if your board is a generic micropython board. 

**Solution:**
1) check if the serial port of your board is detected by running 'pymakr > Extra > List Serial ports'
2) if it is detected, note the serial port manufactures , ie 'Silicon Labs'
3) Add the manufacturmanufacturer to the `autoconnect_comport_manufacturers` names in you project or global config.
3) re-run 'pymakr > Extra > List Serial ports'
4) is the board is not detected as the first , you may need to move it to the front of the list.

## Developing
If you want to contribute to this project you can test the app the following way:

- Download the code or clone the repo
- Install Babel by running `npm install --save-dev babel-core`
- Open the folder in VSC
- Press F1 and execute `Tasks: Run build task` to run the babel builder
- Press F5 to run the plugin (opens a new VSC window)
 
Note: make sure you have the 'code' terminal command installed. See [code setup for Mac(https://code.visualstudio.com/docs/setup/mac)

## Create a local package
- Install the vscode publishing tool by running `npm install -g vsce`
- Create a .vsix package by running `vsce package`
- you can then install the .vsix package by running `code --install-extension pymakr-1.x.y.vsix`