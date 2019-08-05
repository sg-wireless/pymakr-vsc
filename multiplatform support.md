# Multiplatform support 

Pymakr makes use of an Electron/Nodejs module to connect via the serialport to the boards running micropython.
one of the challenges of the serialport module is that it requires a different implementation of different operating systems, versions of these OSs and different CPU architectures. 
This is implemented by using so called 'native bindings' for these. The bindings are usually written in C or C++ and need to be compiled on,or for, each platform specifically.

There are diffent implementation standards to implement the interface between the native c/c++ module and the nodejs or electron runtime. 
The serialport module makes use of an ABI based interface to implement the low-level interface, and uses the ('bindings')[https://github.com/TooTallNate/node-bindings]  module to locate and load the `@serialport\bindings` sub-module  

While the ABI interface does not change for each version of electron/node, it does change over time , and the bad news is that is it not backward compatible.
So over time , as VSCode is updates and moves to a newer version of electron, at some point in time the required ABI version will change, and unless a *correct* binding is available, pymakr will not be able to communicate to the serial port.store functionality

Over the last year this has occurred several times, and each time it required considerable time and manual effort to restore functionality.

# Solution: Include native modules for multiple platforms, and future versions 

The implemented solution :

- determine the current and future electron versions used by vscode
- for each of these versions
    - determine the Application Binary Interface level (ABI) 
    - download the available pre-build 'bindings' for all available platforms and architectures
    - store them in the *correct* location on the file system     
- update to version 1.5.0 (or newer) of the bindings module 

## mp-download.ps1
## bindings module version 1.5.0 or newer 

The  bindings module is used by the serialport module. from version 1.5.0 (Feb 2019) and newer, it supports  to locate and load modules based on a pattern that includes the ABI, which allows us to package for future updates , without the need to include binaries for each and every possible minor version of electron. 

version 1.5.0 uses the storage pattern used by node-pre-gyp and is in the format of 
    `<native-module>/lib/binding/{runtime}-v{abi}-{platform}-{arch}`

so for the @serialport/bindings sub-module on x64 windows running node 10.15.1 the path will be:  
    `<project>\node_modules\@serialport\bindings\lib\binding\node-v64-win32-x64\bindings.node` 

while on ubuntu x64 with node v10.16.0 the path will be:   
    `<project>/node_modules/@serialport/bindings/lib/binding/node-v64-linux-x64/bindings.node`

notice that the different versions of node do use the same ABI (v64)

In order to make sure a good version of the bindings module is used upgrade it to at least 1.5.0 by running:  
`npm install bindings@1.5.0 --save` or `npm install bindings@latest --save`

# To research 
The path used when loading native bindings in a VSCode extension uses 'node' rather than electron as the runtime.
Not sure why this is ....

`c:\develop\pymakr-vsc\node_modules\@serialport\bindings\lib\binding\node-v69-win32-x64\bindings.node`

temp workaround : Manual copy 


## file structure

```
folder structure in <project>/node_modules/@serialport/bindings
+---lib
    \---binding
        +---electron-v64-darwin-x64
        +---electron-v64-linux-ia32
        +---electron-v64-linux-x64
        +---electron-v64-win32-ia32
        +---electron-v64-win32-x64
        +---electron-v69-darwin-x64
        +---electron-v69-linux-ia32
        +---electron-v69-linux-x64
        +---electron-v69-win32-ia32
        +---electron-v69-win32-x64
        +---node-v64-darwin-x64
        +---node-v64-linux-ia32
        +---node-v64-linux-x64
        +---node-v64-win32-ia32
        \---node-v64-win32-x64
``` 
the folder naming convention is `<native-module>/lib/binding/{runtime}-v{abi}-{platform}-{arch}`
each folder contains one file named `bindings.node` which is compiled for that 

# Other approaches 

## Compile on install 


## build, Include and copy on install 

## Related other node modules and technologies 

## allowing backward compatibility 





