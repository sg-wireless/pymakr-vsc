# native module
@serialport/binding@2.0.8

# target
runtime     : electron 
version     : 3.1.2
platform    : win32
arch        : x64
abi         : 64

# origin
windows 10
electron-serialport 
electron@3.1.2 
npx electron-rebuild 

# Check ABI
ABI 70 <- node_modules/@serialport/bindings/bin/linux-x64-70/bindings.node
ABI 70 <- node_modules/@serialport/bindings/build/Release/bindings.node
ABI 70 <- node_modules/@serialport/bindings/build/Release/obj.target/bindings.node
