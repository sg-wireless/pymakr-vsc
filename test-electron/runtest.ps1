#!/usr/bin/env pwsh
param(
    $electron_version = ('7.3.2' , ' 9.3.3')
)
# '4.2.5','5.0.10','6.1.2'
#,9.3.3,9.2.1

# #########################################################################################################
#  Setup 
# #########################################################################################################

$root_folder = Join-Path $PSScriptRoot -ChildPath '..'
$test_folder = $PSScriptRoot
cd $root_folder
# Ensure electron_version is a list
if (!$electron_version.GetType().isArray) {
    $electron_version = $electron_version -split ','
}
# remove duplicate version to speed up testing
$electron_version = $electron_version | sort-object | select-Object -Unique 

function ActionFail ($msg) {
    # Fails Github Action and reports error message
    # Useful for Github Action failure annotations
    Write-Host "::error::$msg"
    exit(1)
}


foreach ($version in $electron_version) { 
    write-host "::group::Test on [Electron $version]"

    #--- Test project 
    write-host "::group::[Electron $version]Test Project: Delete <rootfolder>/test-electron/node_modules/*" 
    cd $test_folder
    # test folder should be npm initialised as a nodejs project 
    # Clean out the test/node_modules to avoid interrerence with other/earlier installs
    Remove-Item $test_folder/node_modules/* -Recurse -Force -ErrorAction SilentlyContinue

    #npm install 
    write-host "::group::[Electron $version]Test Project: install electron $version"
    npm install electron@$version
    #sanity check
    npx electron --version

    Write-Host "::group::[Electron $version]Root Project: Prep for CI Install (npm ci)"
    # --- Root Project 
    cd $root_folder
    npm ci
    npm prune

    
    # also make sure that the native modules are in place for the test 
    # No need top copy twice if root project has ta postinstall script
    # &$root_folder/scripts/mp-download.ps1 -copyonly
    
    #--- Test project 
    write-host "::group::[Electron $version]Test Project: update bindings.js for reporting FIXME"
    cd $test_folder 
    
    # use a version of bindings module that provides some more output on what is loaded 
    # todo: check that the root project is indeed using the same version or build a patch version 
    # hardcoded for bindings@1.5.0
    copy-item $test_folder/bindings_1.5.0/bindings.js $root_folder/node_modules/bindings/bindings.js -force -Verbose
    
    write-host "::group::[Electron $version]Test Project: run electron test app" 
    # &npx electron test/index.js
    #npm run test
    npx electron ./index.js
    write-host "::endgroup::" # end github action group
    if ($LASTEXITCODE -ne 0 ) {
        #--- Root Project 
        cd $root_folder
        ActionFail "serial port cannot be loaded, try to re-build or download new binaries"
    }
    else {
        #--- Root Project 
        cd $root_folder
    }

    write-host "::endgroup::" # end github action group

}
#finally 
exit(0)
