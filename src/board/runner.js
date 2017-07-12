'use babel';

import ApiWrapper from '../main/api-wrapper.js';

export default class Runner {
  constructor(pyboard,terminal,pymakr) {
    this.pyboard = pyboard
    this.terminal = terminal
    this.pymakr = pymakr
    this.api = this.api = new ApiWrapper()
    this.busy = false
  }

  toggle(cb){
    if(this.busy){
      this.stop(cb)
    }else{
      this.start(cb)
    }
  }

  start(cb){
    var _this = this
    this._getCurrentFile(function(file,filename){
      _this.terminal.writeln("Running "+filename)
      _this.busy = true
      _this.pymakr.view.setButtonState()
      _this.pyboard.run(file,function(){
        _this.busy = false
        cb()
      })
    },function onerror(err){
      _this.terminal.writeln_and_prompt(err)
    })
  }

  stop(cb){
    var _this = this
    if(this.busy){
      this.pyboard.stop_running_programs_nofollow(function(){
        _this.pyboard.flush(function(){
          _this.pyboard.enter_friendly_repl(function(){
          })
          _this.busy = false
          cb()
        })
      })
    }
  }


  _getCurrentFile(cb,onerror){
    this.api.getOpenFile(function(file,name){
      var filename = "untitled file"
      if(file){
        filename = name.split('/').pop(-1)
        var filetype = filename.split('.').pop(-1)
        if(filetype != 'py'){
          onerror("Can't run "+filetype+" files, please run only python files")
          return
        }
    //   }else if(buffer.cachedText && buffer.cachedText.length > 0){
    //     file = {cachedContents: buffer.cachedText}
      }else{
        onerror("No file open to run")
        return
      }
      cb(file,filename)
    },onerror)
  }

}
