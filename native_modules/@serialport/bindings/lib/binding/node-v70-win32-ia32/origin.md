# native module
@serialport/binding@2.0.8

# target
runtime     : electron 
version     : 5.0.10
platform    : win32
arch        : ia32
abi         : 70

# origin
Windows 10 
electron-serialport 
electron@5.10 
npx electron-rebuild 

# Check ABI
ABI 70 <- node_modules\@serialport\bindings\bin\win32-x64-70\bindings.node
ABI 70 <- node_modules\@serialport\bindings\build\Release\bindings.node
