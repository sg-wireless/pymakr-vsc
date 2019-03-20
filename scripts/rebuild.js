var exec = require('child_process').exec
var fs = require('fs')
var ncp = require('ncp').ncp;
ncp.limit = 16;

var bindings_target = 'node_modules/@serialport/bindings/build/Release/bindings.node'
var bindings_source = 'precompiles/serialport-<os>/bindings.node'

var precompiles = {'win32': 'win', 'darwin': 'osx', 'linux': 'linux', 'aix': 'linux'}
var os = precompiles[process.platform]
if(os == 'win' && process.arch == 'ia32'){
  os = 'win32'
}
bindings_source = bindings_source.replace('<os>',os)

console.log("Removing old binding")
exec('rm -rf '+bindings_source,function(error,stdout,stderr){
  if(error) console.log(error)
  console.log("Removing node_modules")
  exec('rm -rf node_modules',function(error,stdout,stderr){
    if(error) console.log(error)
    console.log("Running npm install")
    exec('npm install',function(error,stdout,stderr){
      console.log(stdout)
      if(error) console.log("Error during npm install")

      console.log("Copy bindings file")
      copyFile(bindings_target,bindings_source,function(err){
        if(err) console.log(err)
      })
    })
  })
})

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