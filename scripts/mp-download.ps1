<# 
donnload multiple versions of the native bindings of the serialport library 
to allow for dynamic binding of the serialport module on multiple platforms

by downloading additional (future) versions fo the bindings andincluding them in the distribution,
this reduceces the likelyhood of bugs when vscode updates the version of electron.

there is nourantee as this does depend on 
- the prebuilds top be avaiable at the time of packaging 
- some prior knowledge of the future electron ( or ABI) version

#>

# dependencies 
<# 
    npm install @serialport 
    npm install node-abi
    npm install prebuild-install -d

    npm upgrade prebuild-install
#> 
npm upgrade node-abi 

# getAbi('5.0.0', 'electron')
# $version = "6.0.0-beta.0"
# $ABI_ver = &node.exe --print "var abi = require('node-abi');abi.getAbi('$version','electron')"
# Write-Host -F Blue "Electron $version uses ABI $ABI_ver"

$version_vrs = "4.2.5","5.0.0","6.0.0-beta.0"
$platforms = "win32","darwin","linux"
$architectures = "x64","ia32"

#assumes strip is started in project root folder
$folder_root = $PWD
$folder_serial = Join-Path $folder_root -ChildPath '\node_modules\@serialport\bindings'
$folder_bindings = Join-Path $folder_root -ChildPath '\serialport_bindings'
$docs = (Join-Path $folder_bindings "electron versions.md") 
#empty the previous prebuilds
remove-item $folder_bindings -Recurse -ErrorAction SilentlyContinue
mkdir $folder_bindings | Out-Null
"includes support for electron versions:" | Out-File -filepath $docs
Set-Location $folder_serial
foreach ($version  in $version_vrs) {
    # Get the ABI version for electron version x.y.z 
    # getAbi('5.0.0', 'electron')
    $ABI_ver = &node.exe --print "var getAbi = require('node-abi').getAbi;getAbi('$version','electron')"
    Write-Host -F Blue "Electron $version uses ABI $ABI_ver"
    # add to documentation
    "* Electron $version uses ABI $ABI_ver" | Out-File -FilePath $docs -Append 
    foreach ($platform in $platforms){
        foreach ($arch in $architectures){
            Write-Host -f green "Download prebuild native binding for electron: $version, abi: $abi_ver, $platform, $arch"
            .\node_modules\.bin\prebuild-install.cmd --runtime electron --target $version --arch $arch --platform $platform --tag-prefix @serialport/bindings@ 
            if ($LASTEXITCODE -eq 0){
                #OK , now copy the platform folder 
                # from : \@serialport\bindings\build\Release\bindings.node
                #todo: decide on best structure 
                $use_ABI = $true                
                if ($use_ABI) {
                    # ABI 
                    $dest_folder = Join-Path $folder_bindings -ChildPath "abi-$ABI_ver-$platform-$arch"
                } else {
                    # electron 
                    $dest_folder = Join-Path $folder_bindings -ChildPath "electron-$version" -AdditionalChildPath "$platform-$arch"
                }
                # Write-Host 'Copy binding files'

                mkdir $dest_folder -ErrorAction SilentlyContinue
                Copy-Item '.\build\Release\bindings.node' $dest_folder -Force | Out-Null
                # add to documentation
                "   - $platform, $arch" | Out-File -FilePath $docs -Append 

            } else {
                # Write-Warning "no prebuimp-   ld bindings for electron: $version, abi: $abi_ver, $platform, $arch"
            }
        }   
    }
} 
Set-Location $folder_root
