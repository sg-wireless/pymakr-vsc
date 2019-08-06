# Prepare to debug node.js on WLS/linux using your Windows 10 machine 

## Add the `Remote - WSL` add-in to vscode  
Installation
1. Install VS Code or VS Code Insiders and this extension.

2.  Install the Windows Subsystem for Linux along with your preferred glibc based Linux distribution (e.g Debian, Ubuntu. Alpine Linux not yet supported.)

for a list of distributions see : https://github.com/sirredbeard/Awesome-WSL#supported-distributions

3.  Consider adding a .gitattributes file to your repos or disabling automatic line ending conversion for Git on the Windows side by using a command prompt to run: git config --global core.autocrlf input If left enabled, this setting can cause files that you have not edited to appear modified due to line ending differences. See tips and tricks for details.

ref: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl

## install/Update to a more recent node version in wsl/ubuntu 
Node.js v10.x:
@ubuntu
```
# Using Ubuntu
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```
ref: https://github.com/nodesource/distributions#installation-instructions

## install powershell on ubuntu
https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell-core-on-linux?view=powershell-6


## Upgrade git to a decently current version from the git-core repo  
```
sudo add-apt-repository ppa:git-core/ppa -y
sudo apt-get update
sudo apt-get install git -y
git --version
```

