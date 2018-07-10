'use babel';
var fs = require('fs');
import Logger from '../helpers/logger.js'
import ShellWorkers from './shell-workers.js'
import ApiWrapper from '../main/api-wrapper.js';
import Utils from '../helpers/utils.js';
var binascii = require('binascii');
var utf8 = require('utf8');
var crypto = require('crypto');

var EventEmitter = require('events');
const ee = new EventEmitter();

export default class Shell {

  constructor(pyboard,cb,method,settings){
    this.BIN_CHUNK_SIZE = 512
    this.EOF = '\x04' // reset (ctrl-d)
    this.RETRIES = 2
    this.pyboard = pyboard
    this.settings = settings
    this.api = new ApiWrapper()
    this.logger = new Logger('Shell')
    this.workers = new ShellWorkers(this,pyboard,settings)
    this.utils = new Utils(settings)
    var lib_folder = this.api.getPackageSrcPath()

    this.logger.silly("Try to enter raw mode")
    var _this = this
    this.pyboard.enter_raw_repl_no_reset(cb)
  }

  getVersion(cb){
    var command =
        "import os\r\n" +
        "v = os.uname().release" +
        "sys.stdout.write(v)\r\n"

    this.pyboard.exec_(command,function(err,content){
      cb(content)
    })
  }

  getFreeMemory(cb){
    var command =
        "import os\r\n" +
        "m = os.getfree('/flash')" +
        "sys.stdout.write(m)\r\n"

    this.pyboard.exec_(command,function(err,content){
      cb(content)
    })
  }

  writeFile(name,contents,callback,retries=0){
    var _this = this
    this.logger.info("Writing file: "+name)

    var cb = function(err,retry){
      setTimeout(function(){
        callback(err,retry)
      },100)
    }

    var worker = function(content,callback){
      _this.workers.write_file(content,callback)
    }

    var retry = function(err){
      if(retries < _this.RETRIES){
        cb(null,true)
        setTimeout(function(){
            _this.writeFile(name,contents,cb,retries+1)
        },1000)
      }else{
        console.log("No more retries:")
        cb(err)
      }
    }

    var end = function(err,value_processed){
      _this.eval("f.close()\r\n",function(close_err){
        if((err || close_err) && retries < _this.RETRIES){
          retry(err)

        }else if(!err && !close_err){
          _this.compare_hash(name,contents,function(match){
            if(match){
              cb(null)
            }else{
              _this.logger.warning("File hash check didn't match, trying again")
              retry(new Error("Filecheck failed"))
            }
          })
        }else if(err){
          cb(err)
        }else{
          cb(close_err)
        }
      })
    }

    // contents = utf8.encode(contents)
    var get_file_command =
      "import ubinascii\r\n"+
      "f = open('"+name+"', 'wb')\r\n"

    this.pyboard.exec_raw_no_reset(get_file_command,function(){
      _this.utils.doRecursively([contents,0],worker,end)
    })
  }

  readFile(name,callback){
    var _this = this

    var cb = function(err,content_buffer,content_str){
      setTimeout(function(){
        callback(err,content_buffer,content_str)
      },100)
    }

    var command = "import ubinascii,sys\r\n"
    command += "f = open('"+name+"', 'rb')\r\n"

    command += "import ubinascii\r\n"

    command +=
        "while True:\r\n" +
        "    c = ubinascii.b2a_base64(f.read("+this.BIN_CHUNK_SIZE+"))\r\n" +
        "    sys.stdout.write(c)\r\n" +
        "    if not len(c) or c == b'\\n':\r\n" +
        "        break\r\n"

    this.pyboard.exec_raw(command,function(err,content){

      // Workaround for the "OK" return of soft reset, which is sometimes returned with the content
      if(content.indexOf("OK") == 0){
        console.log(content)
        content = content.slice(2,content.length)
        console.log(content)
      }
      var decode_result = _this.utils.base64decode(content)
      var content_buffer = decode_result[1]
      var content_str = decode_result[0].toString()
      console.log(content_str)

      _this.logger.silly(err)
      cb(err,content_buffer,content_str)
    },60000)
  }

  list_files(cb){
    var _this = this
    var file_list = ['']

    var end = function(err,file_list_2){
      cb(undefined,file_list)
    }

    var worker = function(params,callback){
      _this.workers.list_files(params,callback)
    }

    this.utils.doRecursively(['/flash',[''],file_list],worker,end)
  }


  removeFile(name,cb){
    var _this = this
    var command =
        "import os\r\n" +
        "os.remove('"+name+"')\r\n"

    this.eval(command,cb)
  }

  createDir(name,cb){
    var command =
        "import os\r\n" +
        "os.mkdir('"+name+"')\r\n"

    this.eval(command,cb)
  }

  removeDir(name,cb){
    var command =
        "import os\r\n" +
        "os.rmdir('"+name+"')\r\n"

    this.eval(command,cb)
  }

  reset(cb){
    var _this = this
    var command =
        "import machine\r\n" +
        "machine.reset()\r\n"

    this.pyboard.exec_raw_no_reset(command,function(err){
      // don't wait for soft reset to be done, because device will be resetting
      _this.pyboard.soft_reset_no_follow(cb)
    })
  }


  get_version(cb){
    var _this = this
    var command = "import os; os.uname().release\r\n"

    this.eval(command,function(err,content){
      var version = content.replace(command,'').replace(/>>>/g,'').replace(/'/g,"").replace(/\r\n/g,"").trim()
      var version_int = _this.utils.calculate_int_version(version)
      if(version_int == 0 || isNaN(version_int)){
        err = new Error("Error retrieving version number")
      }else{
        err = undefined
      }
      cb(err,version_int,version)
    })
  }


  compare_hash(filename,contents,cb){
    cb(true)
    return
    var hash = crypto.createHash('sha256').update(contents.toString()).digest('hex');
    this.get_hash(filename,function(err,remote_hash){
      cb(hash == remote_hash)
    })
  }

  get_hash(filename,cb){
    var _this = this
    var command =
        "import uhashlib,ubinascii\r\n" +
        "f = open('"+filename+"', 'rb')\r\n" +
        "hash = uhashlib.sha256(f.read())\r\n" +
        "f.close()\r\n" +
        "sys.stdout.write(ubinascii.hexlify(hash.digest()))\r\n"

    this.eval(command,function(err,content){
      content = content.slice(2,-3)
      _this.logger.silly(err)
      _this.logger.silly(content)
      cb(err,content)
    },1000)
  }


  // evaluates command through REPL and returns the resulting feedback
  eval(c,cb,timeout){
    var _this = this
    var command =
        c+"\r\n"

    this.pyboard.exec_raw(command,function(err,content){
      if(!err){
        err = _this.utils.parse_error(content)
      }
      if(err){
        _this.logger.error(err.message)
      }
      setTimeout(function(){
          cb(err,content)
      },100)

    },timeout)
  }

  exit(cb){
    var _this = this

    var finish = function(err){

      if(_this.pyboard.connection.type != 'serial'){
        _this.pyboard.disconnect_silent()
      }
      if(cb){
        cb(err)
      }
    }

    if(this.settings.reboot_after_upload){
      this.reset(finish)
    }else{
      this.pyboard.enter_friendly_repl(function(err){
        _this.pyboard.send("\r\n")
        finish(err)
      })
    }

  }


}
