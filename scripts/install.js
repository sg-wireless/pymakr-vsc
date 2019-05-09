// installing and re-compiling serialport
// executed automatically from package.json on install
var exec = require('child_process').exec
var fs = require('fs')

// bindings params 
// FIXME: Source / target Swap ?
var bindings_target = 'node_modules/@serialport/bindings/build/Release/bindings.node'
var bindings_source = 'precompiles/serialport-<os>/bindings.node'

// electron rebuild params
var electron_version = '3.1.6'
var electron_rebuild_path = "$(npm bin)/"
var electron_rebuild_path_win = '.\\node_modules\\.bin\\' // assuming current directory = project folder

// copy precompiled bindings.node file for correct OS
var precompiles = {'win32': 'win', 'darwin': 'osx', 'linux': 'linux', 'aix': 'linux'}
if(process.platform in precompiles) { // always returns win32 on windows, even on 64bit
  var os = precompiles[process.platform]
  var is_windows = os == 'win'
  if(os == 'win' && process.arch == 'ia32'){
    os = 'win32'
  }

  bindings_source = bindings_source.replace('<os>',os)
  // FIXME: only copies on the 2nd run ( Copy before rebuild ?)
  console.log("Copy bindings file")
  copyFile(bindings_source,bindings_target,function(error){
    if(error){
      console.log("Failed to copy bindings file, pymakr won't work")
      console.log(error)
      fs.writeFile("C:/Users/Pycom/.vscode-insiders/extensions/errorlog.txt",error,function(err){
        if(err) console.log("err");
        if(err) throw err;
        console.log('File is created successfully.');
      })
    }else{
      console.log("Bindings file in place")
    }

  
    
    
    if(!is_windows){
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
            // -f force -v electron version
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
    }
  })
}


function copyFile( source, target, cb) {

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
      console.log("Copy completed")
      done();
      
    });
    rd.pipe(wr);
  }else{
    done(new Error("File "+source+" doesn't exist"))
  }

}
