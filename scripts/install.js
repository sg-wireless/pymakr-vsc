// installing and re-compiling serialport
// executed automatically from package.json on install
var exec = require('child_process').exec
var fs = require('fs')
var vtools = require('./functions-versions.js')

var serialport_version = '6.2.2'
var electron_version = '3.1.2'
var project_folder = "C:\\Users\\<username>\\Projects\\pymakr-vsc"

var electron_rebuild_path = "$(npm bin)/"
var electron_rebuild_path_win = project_folder + '\\node_modules\\.bin\\electron-rebuild'

var compile_for_windows = false
if(process.argv && process.argv.length > 2 && process.argv[2] == 'win'){
  compile_for_windows = true
}

var precompiles = {'win32': 'win', 'darwin': 'osx', 'linux': 'linux', 'aix': 'linux'}
if(process.platform in precompiles) { // always returns win32 on windows, even on 64bit
  var plf = precompiles[process.platform]
  var build = 'build'
  var build_bindings = 'node_modules/bindings/build'
  if(plf == 'win' && process.arch == 'ia32'){
    plf = 'win32'
  }

  var path = "precompiles/serialport-" + plf + ""
  var from = path+'/build/Release/serialport.node'
  var node_file = '/serialport.node'

  console.log("Making dir "+build_bindings)
  if (!fs.existsSync(build_bindings)){
    fs.mkdirSync(build_bindings);
  }

  console.log("Making dir "+build)
  if (!fs.existsSync(build)){
    fs.mkdirSync(build);
  }

  console.log("Copy node file to "+build)
  copyFile(from,build+node_file,function(){

    console.log("Copy node file to "+build_bindings)
    copyFile(from,build_bindings+node_file,function(){
      console.log("Copied both files")
    })
  })
}

// Don't preform on windows, since it almost always fails there. Automatically defaults to precompiled version in /precompiles folder
if (process.platform != 'win32' || compile_for_windows) {
  var exec = require('child_process').exec
  console.log("Installing serialport "+serialport_version)
  exec('npm install serialport@'+serialport_version,
    function(error,stdout,stderr){
      if(error){
        console.log(error)
      }else{
        console.log("Installing electron rebuild")
        exec('npm install electron-rebuild',
          function(error,stdout,stderr){
            if(error){
              console.log(error)
            }else{
              // console.log("Getting current versions")
              // vtools.getCurrentVersions(function(atom,electron_version){

                console.log("Rebuilding for electron "+electron_version+"...")
                var path = electron_rebuild_path
                if(process.platform == 'win32'){
                  path = electron_rebuild_path_win
                }
                exec(path + 'electron-rebuild -f -w serialport -v '+electron_version,
                  function(error,stout,stderr){
                    if(error){
                      console.log(error)
                    }
                    console.log("Done!")
                  }
                )
              // })
            }
          }
        )
      }
    }
  )
}



function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}
