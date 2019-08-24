# native module
@serialport/binding@2.0.8

# target
runtime     : electron 
version     : 5.0.10
platform    : linux
arch        : x64
abi         : 70

# origin
ubuntu 18.04
electron-serialport 
electron@5.10 
npx electron-rebuild 

# Check ABI
ABI 70 <- node_modules/@serialport/bindings/bin/linux-x64-70/bindings.node
ABI 70 <- node_modules/@serialport/bindings/build/Release/bindings.node
ABI 70 <- node_modules/@serialport/bindings/build/Release/obj.target/bindings.node
