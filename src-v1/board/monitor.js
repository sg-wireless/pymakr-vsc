'use babel';
var fs = require('fs');
import Logger from './logger.js'

var EventEmitter = require('events');
const ee = new EventEmitter();

export default class Monitor {

  constructor(pyboard,cb){
    this.logger = new Logger('Monitor')
    this.pyboard = pyboard
    this.disconnecting = false
    this.callbacks = null
    // lib_folder = atom.packages.resolvePackagePath('Pymakr') + "/lib/"

    data = fs.readFileSync(lib_folder + 'board/python/monitor.py','utf8')
    connection_type_params = this.getScriptParams()
    data = connection_type_params + data

    var _this = this

    this.pyboard.enter_raw_repl_no_reset(function(err){
      if(err){
        cb(err)
        return
      }
      _this.pyboard.exec_raw(data+"\r\n",function(err){
        if(err){
          cb(err)
          return
        }
        // giving monitor.py a little time to setup
        setTimeout(function(){
            _this.setupChannel(cb)
        },600)
      })
    })
  }

  getScriptParams(){
    if(this.pyboard.isSerial){
      return "connection_type = 'u'\nTIMEOUT = 5000\n"
    }else{
      var pass = this.pyboard.params.password
      var user = this.pyboard.params.username
      return "connection_type = 's'\ntelnet_login = ('"+pass+"', '"+user+"')\nTIMEOUT = 5000\n"
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

  // restoreChannel(){
  //   var _this = this
  //   this.pyboard.connect(function(){
  //     _this.pyboard.onconnect = _this.callbacks[0]
  //   },this.callbacks[1],this.callbacks[2],this.callbacks[3])
  // }


  removeFile(name,cb){
    var _this = this
    this.logger.info('Sending remove-file command for '+name)
    this.pyboard.send_cmd('\x01\x02',function(){
      // _this.pyboard.flush(function(){
      _this.logger.verbose('Sending 16 bit name length')
        _this.pyboard.send_raw(_this.int_16(name.length),function(){
          // _this.pyboard.flush(function(){
          _this.logger.verbose('Sending name')
            _this.pyboard.send(name,cb)
          // })
        })
      // })
    })
  }


  createDir(name,cb){
    var _this = this
    this.logger.info('Seding create-dir command for '+name)
    this.pyboard.send_cmd('\x01\x04',function(){
      // _this.pyboard.flush(function(){
      _this.logger.verbose('Sending 16 bit name length')
        _this.pyboard.send_raw(_this.int_16(name.length),function(){
          // _this.pyboard.flush(function(){
          _this.logger.verbose('Sending name')
            _this.pyboard.send(name,cb)
          // })
        })
      // })

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
    },7000)
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
              setTimeout(function(){
                _this.logger.verbose('Sending 32 bit content length ('+contents.length+")")
                _this.pyboard.send_raw(_this.int_32(contents.length),function(){
                  _this.pyboard.flush(function(){
                    _this._writeFileChunkRecursive(contents,0,256,cb)
                  })
                })
              },500)
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
          _this.pyboard.send_read(name,4,function(err,number){
            if(err){
              cb(err)
              return
            }
            var b = Buffer(number)
            number = b.readUInt32BE()
            if(number == 0){
              cb(null,"")
            }else{
              _this.pyboard.read(number/2,function(err,content){
                cb(null,content)
              })
            }
          })
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
