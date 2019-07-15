
'{name}-v{version}-{runtime}-v{abi}-{platform}{libc}-{arch}.tar.gz'
/bindings-v2.0.7-node-v64-win32-x64.tar.gz

--runtime 
electron 
node 

--platform 
win32
darwin
linux

--arch
x64
ia32


npm install serialport
> @serialport/bindings@2.0.8 install C:\develop\pymakr-vsc\node_modules\@serialport\bindings
> prebuild-install --tag-prefix @serialport/bindings@ || node-gyp rebuild

npm install serialport


# test version --> ABI resolution 
node .\node_modules\prebuild-install\rc.js --runtime electron --target 4.2.5 --arch x64 --platform win32 --download
node .\node_modules\prebuild-install\rc.js --runtime electron --target 4.2.5 --arch x64 --platform darwin
node .\node_modules\prebuild-install\rc.js --runtime electron --target 4.2.5 --arch x64 --platform linux 
node .\node_modules\prebuild-install\rc.js --runtime electron --target 4.2.5 --arch ia32 --platform win32
node .\node_modules\prebuild-install\rc.js --runtime electron --target 4.2.5 --arch ia32 --platform darwin
node .\node_modules\prebuild-install\rc.js --runtime electron --target 4.2.5 --arch ia32 --platform linux 

# test download

node .\node_modules\prebuild-install\bin.js --runtime electron --target 4.2.5 --arch x64 --platform win32

# Cannot pas the information via the npm commandline :-( 
# npm install C:\develop\pymakr-vsc\node_modules\@serialport\bindings --runtime electron --target 4.2.5 --arch x64 --platform win32
# >> npm ERR! No valid versions available for 4.2.5

#Does not work from toplevel folder 
node .\node_modules\prebuild-install\bin.js --path .\node_modules\@serialport\bindings --runtime electron --target 4.2.5 --arch x64 --platform win32


#change to bindings folder ( this contains a nested copy op prebuild-install ) 
cd .\node_modules\@serialport\bindings
node .\node_modules\prebuild-install\bin.js --runtime electron --target 4.2.5 --arch x64 --platform win32 --tag-prefix @serialport/bindings@2.0.8

C:\develop\pymakr-vsc\node_modules\@serialport\bindings>.\node_modules\.bin\prebuild-install.cmd --runtime electron --target 4.2.5 --arch x64 --platform win32 --verbose
prebuild-install info begin Prebuild-install version 5.3.0
prebuild-install info looking for cached prebuild @ C:\Users\josverl\AppData\Roaming\npm-cache\_prebuilds\e9e8d7-bindings-v2.0.8-electron-v69-win32-x64.tar.gz
prebuild-install http request GET https://github.com/node-serialport/node-serialport/releases/download/v2.0.8/bindings-v2.0.8-electron-v69-win32-x64.tar.gz
prebuild-install http 404 https://github.com/node-serialport/node-serialport/releases/download/v2.0.8/bindings-v2.0.8-electron-v69-win32-x64.tar.gz
prebuild-install WARN install No prebuilt binaries found (target=4.2.5 runtime=electron arch=x64 libc= platform=win32)


404 -1  https://github.com/node-serialport/node-serialport/releases/download/v2.0.8/bindings-v2.0.8-electron-v69-win32-x64.tar.gz
404 -2  https://github.com/node-serialport/node-serialport/releases/download/@serialport/bindings@2.0.82.0.8/bindings-v2.0.8-electron-v69-win32-x64.tar.gz

    3   https://github.com/node-serialport/node-serialport/releases/download/@serialport/bindings@2.0.8/bindings-v2.0.8-electron-v69-win32-x64.tar.gz
        https://github.com/     serialport/node-serialport/releases/download/@serialport/bindings@2.0.8/bindings-v2.0.8-electron-v69-win32-x64.tar.gz


#  prebuild-install "version": "5.3.0"
3 - node .\node_modules\prebuild-install\bin.js --runtime electron --target 4.2.5 --arch x64 --platform win32 --tag-prefix @serialport/bindings@ --verbose 

prebuild-install info begin Prebuild-install version 5.3.0
prebuild-install info looking for cached prebuild @ C:\Users\josverl\AppData\Roaming\npm-cache\_prebuilds\a3ab8a-bindings-v2.0.8-electron-v69-win32-x64.tar.gz
prebuild-install http request GET https://github.com/node-serialport/node-serialport/releases/download/@serialport/bindings@2.0.8/bindings-v2.0.8-electron-v69-win32-x64.tar.gz
prebuild-install http 200 https://github.com/node-serialport/node-serialport/releases/download/@serialport/bindings@2.0.8/bindings-v2.0.8-electron-v69-win32-x64.tar.gz
prebuild-install info downloading to @ C:\Users\josverl\AppData\Roaming\npm-cache\_prebuilds\a3ab8a-bindings-v2.0.8-electron-v69-win32-x64.tar.gz.3276-c56a0913b0f7.tmp
prebuild-install info renaming to @ C:\Users\josverl\AppData\Roaming\npm-cache\_prebuilds\a3ab8a-bindings-v2.0.8-electron-v69-win32-x64.tar.gz
prebuild-install info unpacking @ C:\Users\josverl\AppData\Roaming\npm-cache\_prebuilds\a3ab8a-bindings-v2.0.8-electron-v69-win32-x64.tar.gz
prebuild-install info unpack resolved to C:\develop\pymakr-vsc\node_modules\@serialport\bindings\build\Release\bindings.node
prebuild-install info install Successfully installed prebuilt binary!



4 - Nicer 
> in \<project>\node_modules\@serialport\bindings>
.\node_modules\.bin\prebuild-install.cmd --runtime electron --target 4.2.5 --arch x64 --platform win32 --tag-prefix @serialport/bindings@ --verbose


$platforms = ('win32', 'darwin','linux')
$archs = ('x64','ia32')
$electron_version = '4.2.5'

$precompiles = (dir -Filter 'precompiles').FullName
Set-Location .\node_modules\@serialport\bindings>

# get a precompiled binding 
.\node_modules\.bin\prebuild-install.cmd --runtime electron --target 4.2.5 --arch x64 --platform win32 --tag-prefix @serialport/bindings@ --verbose
# copy it to the precompiles folder 



cd %userprofile%\.vscode\extensions\pycom.pymakr-1.1.2
cd node_modules\@serialport\bindings
.\node_modules\.bin\prebuild-install.cmd --runtime electron --target 4.2.5 --tag-prefix @serialport/bindings@ --verbose --force










