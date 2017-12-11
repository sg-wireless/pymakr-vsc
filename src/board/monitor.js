'use babel';
var fs = require('fs');
import Logger from '../helpers/logger.js'
import ApiWrapper from '../main/api-wrapper.js';

var EventEmitter = require('events');
const ee = new EventEmitter();

export default class Monitor {

  constructor(pyboard,cb,method){
    this.logger = new Logger('Monitor')
    this.pyboard = pyboard
    this.disconnecting = false
    this.callbacks = null
    this.test_read_count = 0
    this.api = new ApiWrapper()
    var lib_folder = this.api.getPackageSrcPath()

    var data = fs.readFileSync(lib_folder + 'python/minified/monitor.py','utf8')
    var connection_type_params = this.getScriptParams(method)
    data = connection_type_params + data
    this.logger.silly("Try to enter raw mode")
    var _this = this
    this.pyboard.enter_raw_repl_no_reset(function(err){
      if(err){
        cb(err)
        return
      }
      _this.logger.silly("Execute monitor code")
      _this.pyboard.exec_raw(data+"\r\n",function(err){
        if(err){
          cb(err)
          return
        }
        // giving monitor.py a little time to setup
        _this.logger.silly("Wait 2 sec")
        setTimeout(function(){
          _this.logger.silly("Setting up channel")
            _this.setupChannel(cb)
        },2000)
      })
    })
  }

  getScriptParams(method){
    var timeout = method == 'receive' ? 30000 : 5000
    if(this.pyboard.isSerial){
      return "connection_type = 'u'\nTIMEOUT = "+timeout+"\n"
    }else{
      var pass = this.api.config('password')
      var user = this.api.config('username')
      return "connection_type = 's'\ntelnet_login = ('"+pass+"', '"+user+"')\nTIMEOUT = "+timeout+"\n"
    }
  }

  setupChannel(cb){
    this.disconnecting = false
    if(this.pyboard.isSerial){
      cb()
    }else{
      this.callbacks = this.pyboard.getCallbacks()
      this.pyboard.disconnect_silent()
      this.pyboard.connect_raw(cb,
        function(err){

          if(!this.disconnecting){
              cb(err)
          }
        },
        function(){
          if(!this.disconnecting){
              cb(new Error("timeout"))
          }
        },
        function(mssg){
          if(mssg.indexOf("ReadTimeout, exit monitor") > -1){
            this.stopped(function(){
              cb(new Error("timeout"))
            })
          }
        }
      )
    }
  }

  removeFile(name,cb){
    var _this = this
    this.logger.info('Sending remove-file command for '+name)
    this.pyboard.send_cmd('\x01\x02',function(){
      _this.logger.verbose('Sending 16 bit name length')
        _this.pyboard.send_raw(_this.int_16(name.length),function(){
          _this.logger.verbose('Sending name')
            _this.pyboard.send(name,function(){
              _this.requestAck(cb)
            })
        })
    })
  }


  createDir(name,cb){
    var _this = this
    this.logger.info('Seding create-dir command for '+name)
    this.pyboard.send_cmd('\x01\x04',function(){
      _this.logger.verbose('Sending 16 bit name length')
        _this.pyboard.send_raw(_this.int_16(name.length),function(){
          _this.logger.verbose('Sending name')
            _this.pyboard.send(name,function(){
              _this.requestAck(cb)
            })
        })
    })
  }

  removeDir(name,cb){
    var _this = this
    this.pyboard.send_cmd('\x01\x05',function(){
      // _this.pyboard.flush(function(){
        _this.pyboard.send_raw(_this.int_16(name.length),function(){
          // _this.pyboard.flush(function(){
            _this.pyboard.send(name,cb)
          // })
        })
      // })

    })
  }

  reset(cb){
    var _this = this
    this.pyboard.send_cmd('\x00\xFE',function(err){
        cb(err)
    },2000)
  }

  send_exit(cb){
    this.pyboard.send_cmd('\x00\xFF',function(err){
      setTimeout(function(err){
        cb(err)
      },400)
    },2000)

  }

  stopped(cb){
    if(this.pyboard.connection.type != 'serial'){
      this.pyboard.disconnect_silent()
    }
  }

  exit(cb){
    var _this = this
    this.disconnecting = true

    this.reset(function(err){
        _this.stopped()
        cb(err)
    })


  }

  requestAck(cb){
    this.pyboard.send_cmd_read('\x00\x00',3,function(err){
      if(err){
        err = "Failed to confirm file transfer"
      }
      cb(err)
    },3000)
  }


  getFreeMemory(cb){
    var _this = this
    this.logger.info('Getting free memory info from board')
    this.pyboard.send_cmd('\x01\x07',function(){
      _this.pyboard.read(2,function(err,number,raw_buffer){
        if(err){
          cb(err)
          return
        }
        number = 0
        if(raw_buffer.length >= 2){
          number = raw_buffer.readUInt16BE()
        }
        _this.logger.info("Got number: "+number)
        _this.pyboard.flush(function(){
          if(number == 0){
            cb(null,"")
          }else{
            cb(number)
          }
        })
      })
    })
  }

  writeFile(name,contents,cb){
    var _this = this
    this.logger.info('Seding write-file command for '+name)
    this.pyboard.send_cmd('\x01\x00',function(){
      _this.logger.verbose('Sending 16 bit name length ')
        _this.pyboard.send_raw(_this.int_16(name.length),function(){
          setTimeout(function(){
            _this.logger.verbose('Sending name')
            _this.pyboard.send(name,function(){

              _this.requestAck(function(err){
                if(err){
                  cb(err)
                  return
                }
                _this.logger.verbose('Sending 32 bit content length ('+contents.length+")")
                _this.pyboard.send_raw(_this.int_32(contents.length),function(){
                  _this.pyboard.flush(function(){
                    _this._writeFileChunkRecursive(contents,0,256,cb)
                  })
                })
              },1000)
            })
          },100)
        })
    })
  }
  _writeFileChunkRecursive(content,block,blocksize,cb){
    var _this = this
    if(!block){ block = 0 }
    var block_start = block*blocksize
    var chunk = content.substring(block_start,block_start+blocksize)
    if(chunk.length == 0){
      _this.pyboard.flush(cb)
    }else{
      var binary_chunk = new Buffer(chunk,"binary")
      this.logger.verbose('Sending chunk '+block+" of "+chunk.length)
      _this.pyboard.send_raw(binary_chunk,function(){
        setTimeout(function(){
          _this.logger.verbose('Requesting ack...')
          _this.requestAck(function(err){
            _this.logger.verbose('Got an ack back, flushing..')
            if(err){
              cb(err)
              return
            }
            // _this.pyboard.flush(function(){
              _this._writeFileChunkRecursive(content,block+1,blocksize,cb)
            // })
          })
        },100)
      })
    }
  }

  readFile(name,cb){
    var _this = this
    this.pyboard.send_cmd('\x01\x01',function(){
      _this.pyboard.send_raw(_this.int_16(name.length),function(){
        setTimeout(function(){
          _this.pyboard.send_read(name,4,function(err,number,raw_buffer){
            if(err){
              cb(err)
              return
            }
            number = 0
            if(raw_buffer.length >= 4){
              number = raw_buffer.readUInt32BE()
            }
            if(number == 0){
              cb(null,"")
            }else{
              _this.pyboard.read(number,function(err,content){
                cb(err,content)
              },3000)
            }
          },3000)
        },200)
      })
    })
  }

  listFiles(cb){
    var _this = this

    this.pyboard.send_cmd('\x01\x06',function(){
        _this.pyboard.read(4,function(err,number,raw_buffer){
          if(err){
            cb(err)
            return
          }
          number = 0
          if(raw_buffer.length >= 4){
            number = raw_buffer.readUInt32BE()
          }
          if(number == 0){
            cb(null,"")
          }else{
            _this.pyboard.read(number,function(err,content){
              var json_content
              try{
                json_content = JSON.parse(content)
              }catch(e){
                err = new Error("Error listing files from the board")
              }
              cb(err,json_content)
            },3000)
          }
        })
    })
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
