Includes support for electron/node versions:
* VSCode [master] uses Electron 4.2.9 , ABI: 69
* VSCode [1.31.0] uses Electron 3.1.2 , ABI: 64
* VSCode [1.35.0] uses Electron 3.1.8 , ABI: 64
* VSCode [1.36.0] uses Electron 4.2.5 , ABI: 69
* VSCode [1.37.0] uses Electron 4.2.7 , ABI: 69
* VSCode [1.40.0] uses Electron 6.1.2 , ABI: 73
* VSCode [master] uses Electron 6.1.2 , ABI: 73

* electron 3.1.2 uses ABI 64
   - win32   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v64-win32-x64\bindings.node
   - win32   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v64-win32-ia32\bindings.node
   - darwin  , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v64-darwin-x64\bindings.node
   - linux   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v64-linux-x64\bindings.node
   - linux   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v64-linux-ia32\bindings.node
* electron 3.1.8 uses ABI 64
   - win32   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v64-win32-x64\bindings.node
   - win32   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v64-win32-ia32\bindings.node
   - darwin  , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v64-darwin-x64\bindings.node
   - linux   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v64-linux-x64\bindings.node
   - linux   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v64-linux-ia32\bindings.node
* electron 4.2.5 uses ABI 69
   - win32   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-win32-x64\bindings.node
   - win32   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v69-win32-ia32\bindings.node
   - darwin  , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-darwin-x64\bindings.node
   - linux   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-linux-x64\bindings.node
   - linux   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v69-linux-ia32\bindings.node
* electron 4.2.7 uses ABI 69
   - win32   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-win32-x64\bindings.node
   - win32   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v69-win32-ia32\bindings.node
   - darwin  , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-darwin-x64\bindings.node
   - linux   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-linux-x64\bindings.node
   - linux   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v69-linux-ia32\bindings.node
* electron 4.2.9 uses ABI 69
   - win32   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-win32-x64\bindings.node
   - win32   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v69-win32-ia32\bindings.node
   - darwin  , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-darwin-x64\bindings.node
   - linux   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v69-linux-x64\bindings.node
   - linux   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v69-linux-ia32\bindings.node

* electron 5.0.0 uses ABI 70
   - win32   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v70-win32-x64\bindings.node
   - win32   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v70-win32-ia32\bindings.node

   - linux   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v70-linux-x64\bindings.node

* electron 6.1.2 uses ABI 73
   - win32   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v73-win32-x64\bindings.node
   - win32   , ia32, .\native_modules\@serialport\bindings\lib\binding\node-v73-linux-ia32\bindings.node
   - darwin  , x64 , <Missing>
   - linux   , x64 , .\native_modules\@serialport\bindings\lib\binding\node-v73-linux-x64\bindings.node
   - linux   , ia32, <Missing>


* node 10.15.1 uses ABI 64
   - win32   , x64 , .\native_modules\@serialport\bindings\compiled\10.15.1\win32\x64\bindings.node
   - win32   , ia32, .\native_modules\@serialport\bindings\compiled\10.15.1\win32\ia32\bindings.node
   - darwin  , x64 , .\native_modules\@serialport\bindings\compiled\10.15.1\darwin\x64\bindings.node
   - linux   , x64 , .\native_modules\@serialport\bindings\compiled\10.15.1\linux\x64\bindings.node
   - linux   , ia32, .\native_modules\@serialport\bindings\compiled\10.15.1\linux\ia32\bindings.node


## CheckABI 

Validation on Windows x64
    ABI 70 <- native_modules\@serialport\bindings\bin\win32-x64-70\bindings.node
    ABI 64 <- native_modules\@serialport\bindings\compiled\10.15.1\win32\x64\bindings.node
    ABI 64 <- native_modules\@serialport\bindings\lib\binding\node-v64-win32-x64\bindings.node
    ABI 69 <- native_modules\@serialport\bindings\lib\binding\node-v69-win32-x64\bindings.node
    ABI 70 <- native_modules\@serialport\bindings\lib\binding\node-v70-win32-x64\bindings.node

Validation on Windows (using Node 32 bit)
    ABI 70 <- native_modules\@serialport\bindings\bin\win32-ia32-70\bindings.node
    ABI 64 <- native_modules\@serialport\bindings\compiled\10.15.1\win32\ia32\bindings.node
    ABI 64 <- native_modules\@serialport\bindings\lib\binding\node-v64-win32-ia32\bindings.node
    ABI 69 <- native_modules\@serialport\bindings\lib\binding\node-v69-win32-ia32\bindings.node
    ABI 70 <- native_modules\@serialport\bindings\lib\binding\node-v70-win32-ia32\bindings.node

Validation on Ubuntu x64
    ABI 70 <- native_modules/@serialport/bindings/bin/linux-x64-70/bindings.node
    ABI 64 <- native_modules/@serialport/bindings/compiled/10.15.1/linux/x64/bindings.node    
    ABI 64 <- native_modules/@serialport/bindings/lib/binding/node-v64-linux-x64/bindings.node
    ABI 69 <- native_modules/@serialport/bindings/lib/binding/node-v69-linux-x64/bindings.node
    ABI 70 <- native_modules/@serialport/bindings/lib/binding/node-v70-linux-x64/bindings.node

Includes support for electron/node versions:
* VSCode [master] uses Electron 6.1.4 , ABI: 73
* VSCode [1.31.0] uses Electron 3.1.2 , ABI: 64
* VSCode [1.38.0] uses Electron 4.2.10 , ABI: 69
* VSCode [1.39.0] uses Electron 4.2.10 , ABI: 69
* VSCode [1.40.0] uses Electron 6.1.2 , ABI: 73
* electron 3.1.2 uses ABI 64
