// installing and re-compiling serialport, only for windows
// change the install script reference in package.json to this file to compile to windows, then run apm install
// Only use to generate pre-compiled serialport lib, never let this be executed by users. The script doesn't work on all (most) pc's
// remember to change the path on line 21 to direct to your user folder

var exec = require('child_process').exec
var vtools = require('./functions-versions.js')

var user_folder = "C:\\Users\\ralph"
var serialport_version = '6.2.2'
var electron_version = '2.0.7'

console.log("Installing serialport")
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
              console.log("Rebuilding...")
              exec(user_folder + '\\Projects\\pymakr-vsc\\node_modules\\.bin\\electron-rebuild -f -w serialport -v '+electron_version,
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
