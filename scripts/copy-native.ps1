## copy the ./native_modules/* into the node_modules folder
# this is called by npm
# -postinstall      = after npm install or npm ci
# (c) jos_verlinde@hotmail.com
# licence MIT 
param() 

Write-Host 'start copy-native.ps1'
$root_folder = $pwd
$native_folder = Join-Path $root_folder 'native_modules'

if ( test-path $native_folder -PathType Container) {
    write-host -ForegroundColor Green "Copy all /native_modules/* into the /node_modules for cross platform packaging."
    #copy/ovedrwrite files and display files copies
    Copy-Item -Path (Join-Path $native_folder '*') -Destination (Join-Path $root_folder 'node_modules') -Container -Force -Recurse -PassThru | 
        Where-Object { !$_.PSIsContainer } | ForEach-Object{ write-host -f green $_.FullName }
    
} else {
    Write-Warning "$PWD/native_modules folder was not found, starting mp-download script..."
    scripts/mp-download.ps1
}
Write-Host 'done.'