# Multiplatform support 

Pymakr makes use of an Electron/Nodejs module to connect via the serialport to the boards running micropython.
one of the challenges of the serialport module is that it requires a different implementation of different operating systems, versions of these OSs and different CPU architectures. 
This is implemented by using so called 'native bindings' for these. The bindings are usually written in C or C++ and need to be compiled on,or for, each platform specifically.

There are different implementation standards to implement the interface between the native c/c++ module and the nodejs or electron runtime. 
The serialport module makes use of an ABI based interface to implement the low-level interface, and uses the ('bindings')[https://github.com/TooTallNate/node-bindings]  module to locate and load the `@serialport\bindings` sub-module  

While the ABI interface does not change for each version of electron/node, it does change over time , and the bad news is that is it not backward compatible.
So over time , as VSCode is updates and moves to a newer version of electron, at some point in time the required ABI version will change, and unless a *correct* binding is available, pymakr will not be able to communicate to the serial port.store functionality

Over the last year this has occurred several times, and each time it required considerable time and manual effort to restore functionality.

# Solution: Include native modules for multiple platforms, and future versions 

The implemented solution :

- determine the current and future electron versions used by VSCode
- for each of these versions
    - determine the Application Binary Interface level (ABI) 
    - download the available pre-build 'bindings' for all available platforms and architectures
    - store them in the *correct* location on the file system     
- update to version 1.5.0 (or newer) of the bindings module 

## TODO /  actions
- Manual TEST IN ELECTRON 
  - [x] win32-x64 
  - [x] ubuntu-x64 
  - [ ] mac 
  - [ ] others
- Manual TEST in VSCode Insider ( newer ABI) 
  - [ ] win32-x64 
  - [ ] ubuntu-x64 
  - [ ] mac 
  - [ ] others
- [ ] cleanup documentation on structure / remove unneeded structure 
- [ ] ask for upstream fix (bindings) on hardcoded runtime (how to detect runtime electron/node ?) 
- [ ] Save native modules to project folder (prebuilds) to (better) allow check-in & avoid removal by `npm ci`
- [ ] integrate into / replace install.js 

- [ ] make sure mp-download.ps1  runs on linux 
- [ ] add documentation  to how to install pwsh on linux 
- [ ]  Add automated tests for loading serialport
  - [ ]  in NODE 
  - [ ]  in electron with same build as VSCode current / future 
- [ ]  add doc how to include build & add additional native modules ( arch linux ...) 


## 'parameters' relevant to determining the correct binding

what        | description                   | example                           |
------------|-------------------------------|-----------------------------------|
runtime     | application type              | node, electron                    |
platform    | OS type                       | win32, linux, darwin (a.k.a. mac) |
ABI         | Application Binary Interface  | 64, 69, 70                        |
architecture| CPU type                      | x64 , ia64                        |


## mp-download.ps1
## bindings module version 1.5.0 or newer 

The  bindings module is used by the serialport module. from version 1.5.0 (Feb 2019) and newer, it supports  to locate and load modules based on a pattern that includes the ABI, which allows us to package for future updates , without the need to include binaries for each and every possible minor version of electron. 

version 1.5.0 uses the storage pattern used by node-pre-gyp and is in the format of 
    `<native-module>/lib/binding/{runtime}-v{abi}-{platform}-{arch}`

so for the @serialport/bindings sub-module on x64 windows running node 10.15.1 the path will be:  
    `<project>\node_modules\@serialport\bindings\lib\binding\node-v64-win32-x64\bindings.node` 

while on ubuntu x64 with node v10.16.0 the path will be:   
    `<project>/node_modules/@serialport/bindings/lib/binding/node-v64-linux-x64/bindings.node`
Note that the different versions of node do use the same ABI (v64)

In order to make sure a good version of the bindings module is used upgrade it to at least 1.5.0 by running:  
`npm install bindings@1.5.0 --save` or `npm install bindings@latest --save`

## runtime is hardcoded in bindings module.
_However_, there is one remaining challenge; the `bindings` module (v1.5.0) does not determine the runtime ( i.e. electron or node ), but is hardcoded  to specify the runtime as 'node'
that means that there is a possible collision where node and electron bindings may need to be stored in the same location.

as the same ABI is used by 'node'  and 'electron' bindings but the binary files are different and incompatible, there is a need  avoid collision by using 2 different storage patterns 
- store precompiled *node* bindings using the *'version pattern'*
- store precompiled *electron*  bindings using the *'node-pre-gyp'* pattern 

## file structure

For electron / node-pre-gyp the folder naming convention is:  
-  `<native-module>/lib/binding/node-v{abi}-{platform}-{arch}`

For node the folder naming convention is:  
- `<native-module>/compiled/{version}/{platform}/{arch}/binding.node`

each folder contains one file named `bindings.node` which is compiled for that platform.

The resulting folder structure is :
```
<project>/node_modules/@serialport/bindings
                                          +---lib
                                          |   \---binding                         (contains the electron bindings per ABI )
                                          |       +---node-v64-darwin-x64
                                          |       +---node-v64-linux-ia32
                                          |       +---node-v64-linux-x64
                                          |       +---node-v64-win32-ia32
                                          |       +---node-v64-win32-x64
                                          |       +---node-v69-darwin-x64
                                          |       +---node-v69-linux-ia32
                                          |       +---node-v69-linux-x64
                                          |       +---node-v69-win32-ia32
                                          |       \---node-v69-win32-x64
                                          +---compiled                            (contains the node bindings, per version)
                                              \---10.15.1
                                                  +---darwin
                                                  |   \---x64
                                                  +---linux
                                                  |   +---ia32
                                                  |   \---x64
                                                  \---win32
                                                      +---ia32
                                                      \---x64
``` 


## Packaging 

>> Delete your node_modules folder, clean your npm cache with npm cache clean --force, and rerun npm install.
- clean node_modules 
    * Delete your node_modules
    * `npm cache clean --force`
- get node modules  
    * `npm install`
- download/refresh the binary bindings
    * `.\scripts\mp-download.ps1`
    * make sure there is no bindings.node in the default location
- [IF SEPERATE FOLDER - copy the binary bindings into the node_modules folder] 
- [cross compile additional platforms]

- [remove/ignore the dev-dependencies from node_modules]
- vsce package 

# Other approaches 

https://github.com/Microsoft/vscode/issues/658


## Compile on install 


## build, Include and copy on install 

## Related other node modules and technologies 

## allowing backward compatibility 

## References 

* Electron - Using Native Node Modules
https://github.com/electron/electron/blob/master/docs/tutorial/using-native-node-modules.md



