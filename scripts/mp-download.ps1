#!/usr/bin/env pwsh
#Requires -Version 6
param (
    # project root path
    $root_folder = $PWD ,
    #where to store the precompiled bindings
    [string][ValidateSet('binding','node-pre-gyp','prebuildify')]
    $pathpattern = 'node-pre-gyp',
    # Use ABI version for paths rather than electron version
    [switch]$ABI_Paths,
    [string[]]$ElectronVersions = @( "3.1.8","4.2.5" | Sort-Object ) ,
    [string[]]$NodeVersions = @('10.15.1') ,
    $platforms = @("win32","darwin","linux") ,
    $architectures = @("x64","ia32")
    #$runtime = 'electron'
) 
#Check if script is started in project root folder

if (-not( (Test-Path './package.json') -and (Test-Path './node_modules'))){
    Write-Error 'Please start in root of project. (package.json and node_modules were not found)'
}
# get bot sets of versions into a single list {runtime}-{version}
$VersionList = @()
foreach ($v in $ElectronVersions) {
    $VersionList=$VersionList + "electron-$v"
}
foreach ($v in $NodeVersions) {
    $VersionList=$VersionList + "node-$v"
}
$VersionList= $VersionList | Sort-Object
# the (sub module = @serialport/bindings)


$module_folder = Join-Path $root_folder -ChildPath 'node_modules/@serialport/bindings'

$module_folder = Join-Path $root_folder -ChildPath 'node_modules/@serialport/bindings'
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

by downloading additional (future) versions fo the bindings and including them in the distribution,
this reduceces the likelyhood of bugs when vscode updates the version of electron.

there is nourantee as this does depend on 
- the prebuilds to be avaiable at the time of packaging 
- some prior knowledge of the future electron ( or ABI) version

# dependencies 
    npm install @serialport 
    npm install node-abi
# dev only (unless runtime download needed )
    npm install prebuild-install -d
#> 
# npm upgrade node-abi 



# todo: read default from github, and split on newline
try {
    #             "https://raw.githubusercontent.com/microsoft/vscode/1.36.1/.yarnrc" 
    $master_url = "https://raw.githubusercontent.com/microsoft/vscode/master/.yarnrc"
    $yaml = Invoke-WebRequest $master_url | Select-Object -Expand Content 
    $yaml = $yaml.Split("`n")
    $currentversion = $yaml | Select-String -Pattern '^target +"(?<targetversion>[0-9.]*)"' -AllMatches | 
            Foreach-Object {$_.Matches} | 
            Foreach-Object {$_.Groups} |
            Where-Object Name -ieq 'targetversion' |
            Select-Object -ExpandProperty Value

    if ( "electron-$currentversion" -in $VersionList ) {
        Write-Host -F Green "VSCode Insider(master branch) uses a known version of Electron: $currentversion"
    }else {
        Write-Host -F Yellow "The VSCode master branch uses a new/unknown version of Electron: $currentversion, that will be used/ added to the prebuilt versions to download"
        $VersionList=$VersionList + "electron-$currentversion" | Sort-Object 
    } 
} catch {
    Write-warning "Unable to determine the Electron version used by VSCode from GitHub"
}

# Store doc in same module folder 
$docs_file = Join-Path $root_folder -ChildPath "included_runtimes.md"

# ensure directory exists
# new-item (Split-Path $docs_file -Parent) -ItemType Directory -ErrorAction SilentlyContinue 

# empty the previous prebuilds : TODO:adjust to new structure 
Write-Host -f Yellow 'todo: improve cleanup'
# remove-item (join-path $module_folder "abi*" ) -Recurse -ErrorAction SilentlyContinue 

# generate / append Document for electron-abi versions
if (Test-Path $docs_file){
    "Includes support for electron/node versions:" | Out-File -filepath $docs_file -Append
} else {
    "Includes support for electron/node versions:" | Out-File -filepath $docs_file 
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
    [string] $arch    
)
    if ($platform -ieq 'darwin' -and $arch -ieq 'ia32'){
        # mac = only 64 bit 
        return $false
    }
    # assume in project root : todo: Check 
    $root_folder = $PWD
    # move into bindings folder to download
    #todo: only if not yet set  $module_folder = Join-Path $root_folder -ChildPath 'node_modules\@serialport\bindings' 
    Set-Location $module_folder
    if ($IsWindows) {
        .\node_modules\.bin\prebuild-install.cmd --runtime $runtime --target $version --arch $arch --platform $platform --tag-prefix @serialport/bindings@ 
    } else {
        # linux / mac : same command , slightly different path
        node_modules/.bin/prebuild-install --runtime $runtime --target $version --arch $arch --platform $platform --tag-prefix @serialport/bindings@
    }
    Set-Location $root_folder
    #true for success 
    return $LASTEXITCODE -eq 0
}

# show initial listing 
foreach ($item in $VersionList) {
    #split runtime-version 
    $runtime, $runtime_ver = $item.split('-')

    #fixme: node / node.exe 
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
                                        $dest_file = Join-Path $module_folder -ChildPath "compiled/$runtime_ver/$platform/$arch/bindings.node"
                        }
                        'electron' {# node-pre-gyp - use the ABIversion for the path (uses less space, better compat)
                                        # ./lib/binding/{node_abi}-{platform}-{arch}`
                                        # \node_modules\@serialport\bindings\lib\binding\node-v64-win32-x64\bindings.node
                                        # Note: runtime is hardcoded as 'node' in path
                                        $dest_file = Join-Path $module_folder -ChildPath "lib/binding/node-v$abi_ver-$platform-$arch/bindings.node" 
                        }
                        'prebuildify' { # https://github.com/prebuild/node-gyp-build 
                                        # <root>/node_modules/@serialport/bindings/prebuilds/<platform>-<arch>\<runtime>abi<abi>.node
                                        #todo : file dest copy 
                                        $dest_file = Join-Path $module_folder -ChildPath "prebuilds/$platform-$arch/($runtime)abi$abi_ver.node"  }
                        default {
                            Write-Warning 'unknown path pattern'
                        }
                    }

                    # make sure the containing folder exists
                    new-item (split-Path $dest_file -Parent) -ItemType Directory -ErrorAction SilentlyContinue | Out-Null
                    $_ = Copy-Item '.\node_modules\@serialport\bindings\build\Release\bindings.node' $dest_file -Force 
                    # add to documentation
                    $Msg = "   - $platform, $arch , $dest_file" 
                    Write-Host $Msg
                    Out-File -InputObject $Msg -FilePath $docs_file -Append 
                } catch {
                    Write-Warning "Error while copying prebuild bindings for runtime $runtime : $runtime_ver, abi: $abi_ver, $platform, $arch"
                } 

            } else {
                # Write-Warning "no prebuild bindings for electron: $runtime_ver, abi: $abi_ver, $platform, $arch"
            }
        }
    }
} 

#Clean release folder to prevent False positives 
Remove-Item "$module_folder/build/release" -Recurse -Force
write-host "Cleaned the release folder, to prevent including and loading the wrong platform"

Write-Host "Platform bindings are listed in, $docs_file"

