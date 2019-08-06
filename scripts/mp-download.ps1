#!/usr/bin/env pwsh
#Requires -Version 6
param (
    # project root path
    $root_folder = $PWD,
    #the versions of vscode to glean the electron versions from 
    [string[]]$VSCodeVersions = @('1.36.1','master'),
    #the base Electron versions to get natives for 
    [string[]]$ElectronVersions = @( "3.1.8","4.2.5" ) ,
    #the base Node versions to get natives form 
    [string[]]$NodeVersions = @('10.15.1') ,
    # the platforms 
    $platforms = @("win32","darwin","linux") ,
    #the processor architectures 
    $architectures = @("x64","ia32"),
    # clean native_modules folder 
    [switch] $clean,
    # do not copy,
    [switch] $nocopy
) 
#Check if script is started in project root folder
if (-not( (Test-Path './package.json') -and (Test-Path './node_modules'))){
    Write-Error 'Please start in root of project. (package.json and node_modules were not found)'
}
# get both sets of versions into a single list {runtime}-{version}
$VersionList = @()
foreach ($v in $ElectronVersions) {
    $VersionList=$VersionList + "electron-$v"
}
foreach ($v in $NodeVersions) {
    $VersionList=$VersionList + "node-$v"
}
$VersionList= $VersionList | Sort-Object
# the (sub module = @serialport/bindings)

#this is where our (sub) module lives
$module_folder = Join-Path $root_folder -ChildPath 'node_modules/@serialport/bindings'
#this is the repo storage location for the native modules
$native_modules = Join-Path $root_folder -ChildPath 'native_modules'
$native_folder = Join-Path $native_modules -ChildPath '@serialport/bindings'

<# 
    supported by ('binding')('serialport')
    <root>/node_modules/@serialport/bindings/compiled/<electron_ver>/<platform>/<arch>/binding.node

    ? possible alternative structures

    The node-pre-gyp docs have the binary go into `./lib/binding/{node_abi}-{platform}-{arch}`
    https://github.com/TooTallNate/node-bindings/commit/68dae5707e5a2c9b831ccdce2720b15edc6e0475#diff-508e6e4b3a3d5225ee7d1e61cdd1adb9
    binding v1.5.0


    <root>/node_modules/@serialport/bindings/bin/win32-x64-69/binding.node
    <root>/node_modules/@serialport/bindings/bin/<platform>-<arch>-<ABI>/binding.node
    
    #<root>/node_modules/@serialport/bindings/compiled/<ABI_ver>/<platform>/<arch>/binding.node

    # https://github.com/prebuild/prebuildify 
    # https://github.com/prebuild/node-gyp-build 
    <root>/node_modules/@serialport/bindings/prebuilds/<platfrom>-<arch>\<runtime>abi<abi>.node

        \develop\pymakr-vsc\node_modules\@serialport\bindings\prebuilds\darwin-x64
        -a----          4-8-2019    16:29         194048 electron.abi48.node
        -a----          4-8-2019    16:28         198656 node.abi47.node
        -a----          4-8-2019    16:28         198656 node.abi48.node


download multiple versions of the native bindings of the serialport library
    to a folder named "abi<ABI_ver>-<platform>-<arch>" 
to allow for dynamic binding of the serialport module on multiple platforms

by downloading additional (future) versions for the bindings and including them in the distribution,
this reduceces the likelyhood of bugs when vscode updates the version of electron.

there isno absolute guarantee as this does depend on:
- the prebuilds to be avaiable at the time of packaging 
- some prior knowledge of the future electron ( or ABI) version

# dependencies 
    npm install @serialport 
    npm install node-abi
# dev only (unless runtime download needed )
    npm install prebuild-install -d
#> 
# npm upgrade node-abi 

function ReadVsCodeElectronVersion {
    param ( [string]$GitTag = 'master' )
    try {
        #          "https://raw.githubusercontent.com/microsoft/vscode/1.36.1/.yarnrc" 
        $git_url = "https://raw.githubusercontent.com/microsoft/vscode/$GitTag/.yarnrc"
        $yaml = Invoke-WebRequest $git_url | Select-Object -Expand Content 
        $yaml = $yaml.Split("`n")
        $version = $yaml | Select-String -Pattern '^target +"(?<targetversion>[0-9.]*)"' -AllMatches | 
                Foreach-Object {$_.Matches} | 
                Foreach-Object {$_.Groups} |
                Where-Object Name -ieq 'targetversion' |
                Select-Object -ExpandProperty Value
        return $version
    } catch {
        Write-warning "Unable to determine the Electron version used by VSCode from GitHub"
        return $null
    }
}

# -Clean : empty the previous prebuilds 
if ($clean -or $true){
    
    Write-Host -f Yellow 'Cleanup the native_modules folder'
    remove-item $native_modules -Recurse -ErrorAction SilentlyContinue 
}

# ensure native_modules directory exists
$_ = new-item $native_modules -ItemType Directory -ErrorAction SilentlyContinue 

# Store doc in native modules folder 
$docs_file = Join-Path $native_modules -ChildPath "included_runtimes.md"
# generate / append Document for electron-abi versions
if (Test-Path $docs_file){
    "Includes support for electron/node versions:" | Out-File -filepath $docs_file -Append
} else {
    "Includes support for electron/node versions:" | Out-File -filepath $docs_file 
}

# get electron versions for all relevant vscode versions 
foreach ($tag in $VSCodeVersions ){
    $version = ReadVsCodeElectronVersion -GitTag $tag
    # Add to documentation
    "* VSCode [$tag] uses Electron $version"| Out-File -filepath $docs_file -Append

    if ( "electron-$version" -in $VersionList ) {
        Write-Host -F Green "VSCode [$tag] uses a known version of Electron: $version"
    }else {
        Write-Host -F Yellow "VSCode [$tag] uses an additional version of Electron: $version, that will be used/ added to the prebuilt versions to download"
        $VersionList=$VersionList + "electron-$version" | Sort-Object 
    } 
}

function DownloadPrebuild {

    param( 
        # Runtime (node/electron)     
        [string] $runtime = 'electron', 
        # Electron version     
        [string] $version, 
        # Platform win32/darwin/linux
        [string] $platform, 
        # CPU architecture x64 /ia32 
        [string] $arch,
        [string] $prefix = '@serialport/bindings@'
        # $module_folder  #todo: add param for more flexibility  
    )
    if ($platform -ieq 'darwin' -and $arch -ieq 'ia32'){
        # mac = only 64 bit 
        return $false
    }
    # assume in project root todo: check
    $root_folder = $PWD
    # move into bindings folder to download
    # todo: add error chcking to set-location 
    Set-Location $module_folder
    if ($IsWindows) {
        .\node_modules\.bin\prebuild-install.cmd --runtime $runtime --target $version --arch $arch --platform $platform --tag-prefix $prefix
    } else {
        # linux / mac : same command , slightly different path
        node_modules/.bin/prebuild-install --runtime $runtime --target $version --arch $arch --platform $platform --tag-prefix $prefix
    }
    Set-Location $root_folder
    #true for success 
    return $LASTEXITCODE -eq 0
}

# show initial listing 
foreach ($item in $VersionList) {
    #split runtime-version 
    $runtime, $runtime_ver = $item.split('-')
    # handle platforms
    $cmd = "var getAbi = require('node-abi').getAbi;getAbi('$runtime_ver','$runtime')"
    if ($IsWindows) {
        $ABI_ver = &node.exe --print $cmd
    } else {
        $ABI_ver = &node --print $cmd
    }
    Write-Host -F Blue "$runtime $runtime_ver uses ABI $ABI_ver"
}

#now the processing 
foreach ($item in $VersionList) {
    #split runtime-version 
    $runtime, $runtime_ver = $item.split('-')

    # Get the ABI version for node/electron version x.y.z 
    $cmd = "var getAbi = require('node-abi').getAbi;getAbi('$runtime_ver','$runtime')"
    if ($IsWindows) {
        $ABI_ver = &node.exe --print $cmd
    } else {
        $ABI_ver = &node --print $cmd
    }

    # add to documentation
    "* $runtime $runtime_ver uses ABI $ABI_ver" | Out-File -FilePath $docs_file -Append 
    foreach ($platform in $platforms){
        foreach ($arch in $architectures){
            Write-Host -f green "Download prebuild native binding for runtime $runtime : $runtime_ver, abi: $abi_ver, $platform, $arch"
            $OK = DownloadPrebuild -version $runtime_ver -platform $platform -arch $arch -runtime $runtime
            if ( $OK ) {
                try {
                    #OK , now copy the platform folder 
                    # from : \@serialport\bindings\build\Release\bindings.node
                    # to a folder per "abi<ABI_ver>-<platform>-<arch>"
                    #$dest_folder = Join-Path $module_folder -ChildPath "abi$ABI_ver-$platform-$arch"
                    switch ($runtime) {
                        'node' {        # use the node version for the path ( implemended by binding) 
                                        # supported by ('binding')('serialport')
                                        # <root>/node_modules/@serialport/bindings/compiled/<version>/<platform>/<arch>/binding.node
                                        # Note: runtime is not used in path 
                                        $dest_file = Join-Path $native_folder -ChildPath "compiled/$runtime_ver/$platform/$arch/bindings.node"
                        }
                        'electron' {# node-pre-gyp - use the ABIversion for the path (uses less space, better compat)
                                        # ./lib/binding/{node_abi}-{platform}-{arch}`
                                        # \node_modules\@serialport\bindings\lib\binding\node-v64-win32-x64\bindings.node
                                        # Note: runtime is hardcoded as 'node' in path
                                        $dest_file = Join-Path $native_folder -ChildPath "lib/binding/node-v$abi_ver-$platform-$arch/bindings.node" 
                        }
                        'prebuildify' { # https://github.com/prebuild/node-gyp-build 
                                        # <root>/node_modules/@serialport/bindings/prebuilds/<platform>-<arch>\<runtime>abi<abi>.node
                                        #todo : file dest copy 
                                        $dest_file = Join-Path $native_folder -ChildPath "prebuilds/$platform-$arch/($runtime)abi$abi_ver.node"  }
                        default {
                            Write-Warning 'unknown path pattern'
                        }
                    }
                    # make sure the containing folder exists
                    new-item (split-Path $dest_file -Parent) -ItemType Directory -ErrorAction SilentlyContinue | Out-Null
                    $_ = Copy-Item '.\node_modules\@serialport\bindings\build\Release\bindings.node' $dest_file -Force 
                    Write-Host " -> $dest_file"
                    # add to documentation.md
                    $msg = "   - {0,-8}, {1,-4}, {2}" -f $platform, $arch , ($dest_file.Replace($root_folder,'.'))
                    Out-File -InputObject $msg -FilePath $docs_file -Append 
                } catch {
                    Write-Warning "Error while copying prebuild bindings for runtime $runtime : $runtime_ver, abi: $abi_ver, $platform, $arch"
                } 

            } else { # no need to show multiple warnings 
                # Write-Warning "no prebuild bindings for electron: $runtime_ver, abi: $abi_ver, $platform, $arch"
            }
        }
    }
} 

# Always Clean module release folder to prevent the wrong runtime from being blocking other platforms  
Remove-Item "$module_folder/build/release" -Recurse -Force
write-host -ForegroundColor Green  "`nCleaned the '$module_folder/build/release' folder, to prevent including and break cross-platform portability."

# -NoCopy : to avoid copying 
if (-not $NoCopy) {
    write-host -ForegroundColor Green "Copy all /native_modules into the /node_modules for cross platform packaging "
    Copy-Item -Path $native_modules -Destination (Join-Path $root_folder 'node_modules')  -Force -Recurse 
}

Write-Host -ForegroundColor blue "Platform bindings are listed in, $docs_file"

