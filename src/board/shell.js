'use babel';
var fs = require('fs');
import Logger from '../helpers/logger.js'
import ShellWorkers from './shell-workers.js'
import ApiWrapper from '../main/api-wrapper.js';
import Utils from '../helpers/utils.js';
var binascii = require('binascii');
var utf8 = require('utf8');

var EventEmitter = require('events');
const ee = new EventEmitter();

export default class Shell {
  
  

  constructor(pyboard,cb,method,settings){
    this.BIN_CHUNK_SIZE = 512
    this.EOF = '\x04' // reset (ctrl-d)
    this.pyboard = pyboard
    this.settings = settings
    this.api = new ApiWrapper()
    this.logger = new Logger('Monitor')
    this.workers = new ShellWorkers(this,pyboard,settings)
    this.utils = new Utils()
    var lib_folder = this.api.getPackageSrcPath()

    var data = fs.readFileSync(lib_folder + 'python/minified/monitor.py','utf8')
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

  writeFile(name,contents,cb){
    var _this = this


    var worker = function(content,callback){
      _this.workers.write_file(content,callback)
    }

    var end = function(err){
      _this.eval("f.close()\r\n",function(close_err){
        if(err){
          cb(err)
        }else{
          cb(close_err)
        }
      })
    }

    contents = utf8.encode(contents)
    var get_file_command =
      "import ubinascii\r\n"+
      "f = open('"+name+"', 'wb')\r\n"

    this.pyboard.exec_raw_no_reset(get_file_command,function(){
      _this.utils.doRecursively(contents,worker,end)
    })
  }

  readFile(name,cb){
    var _this = this

    var command = "import ubinascii,sys\r\n"
    command += "f = open('"+name+"', 'rb')\r\n"

    command += "import ubinascii\r\n"

    command +=
        "while True:\r\n" +
        "    c = ubinascii.hexlify(f.read("+this.BIN_CHUNK_SIZE+"))\r\n" +
        "    if not len(c):\r\n" +
        "        break\r\n" +
        "    sys.stdout.write(c)\r\n"

    this.pyboard.exec_raw(command,function(err,content){
      content = binascii.unhexlify(content)
      content = content.slice(1,-2)
      _this.logger.silly(err)
      _this.logger.silly(content)
      cb(err,content)
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


  // evaluates command through REPL and returns the resulting feedback
  eval(c,cb){
    var _this = this
    var command =
        c+"\r\n"

    this.pyboard.exec_raw(command,function(err,content){
      if(!err){
        err = _this.utils.parse_error(content)
      }
      if(err){
        this.logger.error(err.message)
      }
      cb(err,content)
    })
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
