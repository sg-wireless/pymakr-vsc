## 1.1.2 - Bugfixes
- Solving major issue with new serialport precompiles. Bindings.node is now moved to the correct folder on first start
- Bugfix for reading local files wihout extension (when doing upload or download). 
- Added 'env' and 'venv' folders to default ignore list
- Added missing rxjs dependancy

## 1.1.1 - Bugfixes
- Preventing electron-rebuild on install on windows, which made serialport library malfunction. Fixes issue #42
- Handling format errors in project config file. Fixes issue #43

## 1.1.0 - Improvements
- Multiple download and upload stability improvements and bugfixes [@josverl]
- Multiple bugfixes in UI and other code [@josverl]
- Smaller package size by improving the way the precompiled serialport library is stored 
- Detecting root folder of the board to fix compatibility with non-pycom boards [@josverl]
- Made Nodejs version check blocking
- Compability fix with atom project settings
- Dependancy vulnerability fix

## 1.0.7 - minor improvements
- Fixed issue with error handling when sync_folder is not set correctly
- Improved user feedback for autoconnect feature
- Fixed autoconnect compatibility for expansionboard 3.1 on windows
- Added comport list for autoconnect to config file

## 1.0.6
- Fixed compatibility with VSCode v1.31
- Small bugfix for error that occurred when typing while plugin is loading

## 1.0.5
- Feature identical to Pymakr for Atom v1.4.9
- Added experimental 'fast upload' option, using zlib compression
- Improved upload stability, especially for bigger files
- Improved debugging, build task, added sourcemaps [@Josverl]
- Fix issue where project config change wouldn't refresh
- Code cleanups
- Multiple bugfixes

## 1.0.4
- Fix re-connection to board 
- Prevent generic boards to hang in boatloader [@Josverl]
- Added additional dev info to readme file [@Josverl]
- Rebuild serialport libraries for latest vscode version (1.28.2)
- Add experimental Run Selection to run only a single line or block of code (only works with shortkey ctrl+shift+enter) [@Josverl]

## 1.0.3 - Minor changes
- Linux fix in precompiles of serialport library
- Added warnings when board connected in other screen or atom

## 1.0.2 - Support
- Updated support for latest VSCode versions / electron 2.0.5

## 1.0.1 - Hotfix
- Bugfix in telnet connection

## 1.0.0 - Same codebase as Pymakr for Atom
- Complete rebuild of upload and download feature
- Autoconnect feature
- Upload any type of file (also binary files like jpg, mpy or cert files)
- Several bugfixes and improvements

## 0.1.7
- Added config option to change the status bar buttons

## 0.1.6
- Fixed windows64 issue with serialport lib
- Ctrl-e for paste-mode working on windows

## 0.1.5
- Added 'download' feature
- Code up to date with development in Pymakr for Atom
- Fixed rare infinite loop bug in terminal
- New precompiled serialport libs for all OS's

## 0.1.0
- Initial release
- All basic features working the same as Pymakr Atom v1.0.3
- Terminal implemented inside existing VSC terminal tab
- All features accessible as commands as well as status bar buttons
