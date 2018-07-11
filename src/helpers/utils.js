'use babel';
import Config from '../config.js'
var vscode = require('vscode');
var path = require('path');
var os = require('os');
var homeDir = os.homedir();


// Import this class and create a new logger object in the constructor, providing
// the class name. Use the logger anywhere in the code
// this.logger = new Logger('Pyboard')
// this.logger.warning("Syncing to outdated firmware")
// Result in the console will be:
// [warning] Pyboard | Syncing to outdated firmware

export default class Utils {


  constructor(settings){
    this.settings = settings

    // TODO: grab from a .pyignore file or setting
    this.ignore_list = ["project.pymakr"]
    this.allowed_file_types = this.settings.get_allowed_file_types()
  }

  // runs a worker recursively untill a task is Done
  // worker should take 2 params: value and a continuation callback
    // continuation callback takes 2 params: error and the processed value
  // calls 'end' whenever the processed_value comes back empty/null or when an error is thrown
  doRecursively(value,worker,end){
    var _this = this
    worker(value,function(err,value_processed,done){

        if(err){
          end(err)
        }else if(done){
          end(null,value_processed)
        }else{
          _this.doRecursively(value_processed,worker,end)

        }
    })
  }

  // vscode
  static getConfigPath(filename){
    var folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.platform == 'linux' ? Utils.joinPath(homeDir, '.config') : '/var/local');
    if(/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
    return Utils.joinPath(folder, "/Code/User/", filename ? filename : "");
  }

  static joinPath(){        
    var p = "";
    for(var i=0; i<arguments.length; i++){
        p = path.join(p, arguments[i]);
    }
    return Utils.normalize(p);
  }

  static normalize(p){
    return path.normalize(p).replace(/\\/g, '/')
  }

  base64decode(b64str){
    var content = ""
    var buffer_list = []
    var b64str_arr = b64str.split('=')
    console.log(b64str_arr.length)
    for(var i=0;i<b64str_arr.length;i++){
      var chunk = b64str_arr[i]
      if(chunk.length > 0){
        if(i == b64str_arr.length-3){
          chunk += '=='
        }else{
          chunk += '='
        }
        console.log(i)
        console.log(chunk)
        var bc = Buffer.from(chunk, 'base64')
        var bc_str = bc.toString()
        console.log(bc_str)
        buffer_list.push(bc)
        content += bc_str
      }
    }
    return [content,buffer_list]
  }


  plural(text,number){
    return text + (number == 1 ? "" : "s")
  }

  parse_error(content){
    var err_index = content.indexOf("OSError:")
    if(err_index > -1){
      return Error(content.slice(err_index,content.length-2))
    }else{
      return null
    }
  }


  calculate_int_version(version){
    var known_types = ['a', 'b', 'rc', 'r']
    if(!version){
      return 0
    }
    var version_parts = version.split(".")
    var dots = version_parts.length - 1
    if(dots == 2){
      version_parts.push('0')
    }

    for(var i=0;i<known_types.length;i++){
      var t = known_types[i]
      if(version_parts[3] && version_parts[3].indexOf(t)> -1){
        version_parts[3] = version_parts[3].replace(t,'')
      }
    }

    var version_string = ""

    for(var i=0;i<version_parts.length;i++){
      var val = version_parts[i]
      if(parseInt(val) < 10){
        version_parts[i] = '0'+val
      }
      version_string += version_parts[i]
    }
    return parseInt(version_string)
  }

  ignore_filter(file_list){
    var _this = this
    var new_list = []
    for(var i=0;i<file_list.length;i++){
      var file = file_list[i]
      if(file && file != "" && file.length > 0 && file.substring(0,1) != "."){
        if(file.indexOf(".") == -1 || this.settings.sync_all_file_types || this.allowed_file_types.indexOf(file.split('.').pop()) > -1){
          if(this.ignore_list.indexOf(file) == -1){
            new_list.push(file)
          }
        }
      }
    }
    return new_list
  }

  _was_file_not_existing(exception){
   var error_list = ['ENOENT', 'ENODEV', 'EINVAL', 'OSError:']
   var stre = exception.message
   for(var i=0;i<error_list.length;i++){
     if(stre.indexOf(error_list[i]) > -1){
       return true
     }
   }
   return false
  }

  int_16(int){
    var b = new Buffer(2)
    b.writeUInt16BE(int)
    return b
  }

  int_32(int){
    var b = new Buffer(4)
    b.writeUInt32BE(int)
    return b
  }
}
