var exec = require('child_process').exec
var fs = require('fs')
var ncp = require('ncp').ncp;

ncp.limit = 16;

var precompiles = {'win32': 'win', 'darwin': 'osx', 'linux': 'linux', 'aix': 'linux'}
var plf = precompiles[process.platform]
var build_path = 'build'
var build_bindings = 'node_modules/bindings/build'
if(plf == 'win' && process.arch == 'ia32'){
  plf = 'win32'
}

var precompile_path = "precompiles/serialport-" + plf + ""
var node_modules_path = "node_modules/serialport"
var build_file_path = precompile_path+'/build/Release/serialport.node'
var node_file = '/serialport.node'

console.log("Removing node_modules")
exec('rm -rf node_modules',function(error,stdout,stderr){
  if(error) console.log(error)
  console.log("Running npm install")
  exec('npm install',function(error,stdout,stderr){
    if(error) console.log(error)
    console.log("Remove old precompile")
    exec('rm -rf '+precompile_path,function(error,stdout,stderr){
      if(error) console.log(error)
      console.log("Copy new serialport lib to precompile path")
      copyFolder(node_modules_path,precompile_path,function(err){
        if(error) console.log(error)
        console.log("Place build files")
        placeBuildFiles(function(){
          if(error) console.log(error)
          console.log("Remove serialport from node_modules")
          exec('rm -rf node_modules/serialport',function(error,stdout,stderr){
            if(error) console.log(error)
            console.log("Ready for testing!")
          })
        })
      })
    })
  })
})

function placeBuildFiles(cb){

    if (!fs.existsSync(build_bindings)){
      fs.mkdirSync(build_bindings);
    }

    if (!fs.existsSync(build_path)){
      fs.mkdirSync(build_path);
    }


    if (!fs.existsSync(precompile_path)){
      fs.mkdirSync(precompile_path);
    }


    copyFile(build_file_path,build_path+node_file,function(err){
      if(err) console.log(err)


      copyFile(build_file_path,build_bindings+node_file,function(err){
        if(err) console.log(err)
        cb()
      })
    })

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

function copyFolder(source,destination,cb){
 ncp(source, destination, function (err) {
  if (err) {
    cb(err)
    return console.error(err);
  }else{
    cb()
  }
 });
}
