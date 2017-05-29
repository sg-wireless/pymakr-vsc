// installing and re-compiling serialport
// not needed on windows, for which a pre-compiled version is included in the lib/connections/serialport-win folder
if (process.platform != 'win32') {
  var exec = require('child_process').exec;
  exec('npm install electron-rebuild',
  function(error,stdout,stderr){
    if(error){
      console.log(error)
    }else{
      exec('npm install serialport',
      function(error,stdout,stderr){
        if(error){
          console.log(error)
        }else{
          exec('$(npm bin)/electron-rebuild -f -w serialport -v 1.6.8',
          function(error,stout,stderr){
            if(error){
              console.log(error)
            }
          })
        }
      })
    }
  })
}