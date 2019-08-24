# native module
@serialport/binding@2.0.8

# target
runtime     : electron 
version     : 5.0.10
platform    : darwin
arch        : x64
abi         : 70

# origin
Windows 10 
npx prebuild-install --runtime electron --target 5.0.10 --arch x64 --platform darwin --tag-prefix @serialport/bindings@  

# Check ABI
