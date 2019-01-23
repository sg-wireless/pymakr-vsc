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
