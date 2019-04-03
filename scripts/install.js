// installing and re-compiling serialport
// executed automatically from package.json on install
var exec = require('child_process').exec
var fs = require('fs')

// bindings params
var bindings_target = 'node_modules/@serialport/bindings/build/Release/bindings.node'
var bindings_source = 'precompiles/serialport-<os>/bindings.node'

// electron rebuild params
var electron_version = '3.1.6'
var project_folder = "C:\\Users\\<username>\\Projects\\pymakr-vsc"
var electron_rebuild_path = "$(npm bin)/"
var electron_rebuild_path_win = project_folder + '\\node_modules\\.bin\\electron-rebuild'

// copy precompiled bindings.node file for correct OS
var precompiles = {'win32': 'win', 'darwin': 'osx', 'linux': 'linux', 'aix': 'linux'}
if(process.platform in precompiles) { // always returns win32 on windows, even on 64bit
  var os = precompiles[process.platform]
  
  if(os == 'win' && process.arch == 'ia32'){
    os = 'win32'
  }

  bindings_source = bindings_source.replace('<os>',os)

  console.log("Copy bindings file")
  copyFile(bindings_source,bindings_target,function(error){
    console.log(error)
    
    // Try to run electron rebuild anyway (just in case we're installing on a newer version of vsc with updated electron)
    console.log("Installing electron rebuild")
    exec('npm install electron-rebuild',
      function(error,stdout,stderr){
        if(error){
          console.log(error)
        }else{
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
                console.log("done")
              }
            )
        }
      }
    )
  
  })
}





function copyFile(source, target, cb) {
  
  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }

  if(fs.existsSync(source)){

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
  }else{
    done(new Error("File "+source+" doesn't exist"))
  }

}
