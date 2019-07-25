`
$version_vrs = "3.1.6","4.2.5"
$platforms = "win32","darwin","linux"
$architectures = "x64","ia32"

#assumes strip is started in project root folder
$folder_root = $PWD
$folder_serial = Join-Path $folder_root -ChildPath '\node_modules\@serialport\bindings'
$folder_bindings = Join-Path $folder_root -ChildPath '\serialport_bindings'


Set-Location $folder_serial
foreach ($version  in $version_vrs) {
    # Get the ABI version for electron version x.y.z 
    # getAbi('5.0.0', 'electron')
    $ABI_ver = &node.exe --print "var getAbi = require('node-abi').getAbi;getAbi('$version','electron')"
    Write-Host -F Blue "Electron $version uses ABI $ABI_ver"

    foreach ($platform in $platforms){
        foreach ($arch in $architectures){
            Write-Host -f green "Download prebuild native binding for electron: $version, abi: $abii_ver, $platform, $arch"
            .\node_modules\.bin\prebuild-install.cmd --runtime electron --target $version --arch $arch --platform $platform --tag-prefix @serialport/bindings@ 
            if ($LASTEXITCODE -eq 0){
                #OK , now copy the platform folder 
                # from : \@serialport\bindings\build\Release\bindings.node
                #todo: decide on best structure 
                $use_ABI = $false                
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
            } else {
                # Write-Warning "no prebuimp-   ld bindings for electron: $version, abi: $abii_ver, $platform, $arch"
            }
        }   
    }
} 
Set-Location $folder_root
