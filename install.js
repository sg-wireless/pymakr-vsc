// installing and re-compiling serialport
// not needed on windows, for which a pre-compiled version is included in the lib/connections/serialport-win folder
if (process.platform != 'win32') {
  var exec = require('child_process').exec;
  exec('apm --version',
    function(error,stdout,stderr){
      if(error){
        console.log(error)
        return error
      }else{
        if(getPythonVersion(stdout) == "2"){

        }else{

        }

      }

    }
  )
  exec('npm install serialport',
  function(error,stdout,stderr){
    if(error){
      console.log(error)
      return error
    }else{
      exec('electron-rebuild -f -w serialport -v 1.3.13',
      function(error,stout,stderr){
        if(error){
          console.log(error)
          return error
        }
        return true
      })
    }
  })
}


function getPythonVersion(apm_version){
  var py_index = apm_version.indexOf('python')
  var python_version = apm_version.substring(py_index+12,py_index + 100).toString().substring(5,6)
  return python_version
}
