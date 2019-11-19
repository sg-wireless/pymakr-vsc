#!/usr/bin/env pwsh
param(
    $electron_version = '6.1.2'
)
# '4.2.5','5.0.10','6.1.2'

# #########################################################################################################
#  Setup 
# #########################################################################################################

$root_folder = Join-Path $PSScriptRoot -ChildPath '..'
$test_folder = $PSScriptRoot
cd $root_folder



foreach ($version in $electron_version) { 
    write-host "get ready to test on electron $version"

    # Root Project 
    # write-host "Root Project: <Delete rootfolder>/node_modules/*" 
    # Remove-Item $root_folder/node_modules/* -Recurse -Force -ErrorAction SilentlyContinue

    #--- Test project 
    cd $test_folder
    # test folder should be npm initialised as a nodejs project 
    write-host "Test Project: Delete <rootfolder>/test-electron/node_modules/*" 

    # Clean out the test/node_modules to avoid interrerence with other/earlier installs
    Remove-Item $test_folder/node_modules/* -Recurse -Force -ErrorAction SilentlyContinue

    #npm install 
    write-host "TEST Project: install electron version $version"
    npm install electron@$version

    #sanity check
    npx electron --version

    # --- Root Project 
    cd $root_folder

    Write-Host "Root Project: Prep for CI Install (npm ci)"
    npm ci
    npm prune

    # also make sure that the native modules are in place for the test 
    # No need top copy twice if root project has ta postinstall script
    # &$root_folder/scripts/mp-download.ps1 -copyonly

    #--- Test project 
    cd $test_folder 

    # use a version of bindings module that provides some more output on what is loaded 
    # todo: check that the root project is indeed using the same version or build a path version 
    # hardcoded for bindings@1.5.0
    copy-item $test_folder/bindings_1.5.0/bindings.js $root_folder/node_modules/bindings/bindings.js -force -Verbose

    write-host "run test app" 
    # &npx electron test/index.js
    #npm run test
    npx electron ./index.js
    if ($LASTEXITCODE -ne 0 ){
        Write-Warning "serial port cannot be loaded, try to re-build"

        #--- Root Project 
        cd $root_folder
        exit(-1)
    } else {
        #--- Root Project 
        cd $root_folder
    }

}
#finally 
exit(0)
