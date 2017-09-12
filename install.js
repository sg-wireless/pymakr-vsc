// installing and re-compiling serialport
// executed automatically from package.json on install

var exec = require('child_process').exec

// Don't preform on windows, since it often fails there. Automatically defaults to precompiled version in /precompiles folder
if (process.platform != 'win32') {
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
              exec('$(npm bin)/electron-rebuild -f -w serialport -v 1.7.7',
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
}
