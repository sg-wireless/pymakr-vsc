// installing and re-compiling serialport
// executed automatically from package.json on install

var exec = require('child_process').exec
var fs = require('fs')

// Don't preform on windows, since it often fails there. Automatically defaults to precompiled version in /precompiles folder
if (process.platform != 'win32') {

  console.log("Installing serialport")

  console.log("Instadlling electron rebuild")
  exec('npm install electron-rebuild',
    function(error,stdout,stderr){
      if(error){
        console.log(error)
      }else{
        console.log("Rebuilding...")
        exec('$(npm bin)/electron-rebuild -f -w serialport -v 2.0.5',
          function(error,stout,stderr){
            if(error){
              console.log(error)
            }else{
              console.log("Rebuild done")
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
