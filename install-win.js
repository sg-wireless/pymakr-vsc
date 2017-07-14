// installing and re-compiling serialport, only for windows
// change the install script reference in package.json to this file to compile to windows, then run apm install
// Only use to generate pre-compiled serialport lib, never let this be executed by users. The script doesn't work on all (most) pc's
// remember to change the path on line 21 to direct to your user folder

var exec = require('child_process').exec

console.log("Installing serialport")
exec('npm install serialport',
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
            console.log("Rebuilding...")
            exec('C:\\Users\\devel\\Projects\\pymakr-atom\\node_modules\\.bin\\electron-rebuild -f -w serialport -v 1.6.11',
              function(error,stout,stderr){
                if(error){
                  console.log(error)
                }
                console.log("Done!")
              }
            )
          }
        }
      )
    }
  }
)
