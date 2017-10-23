'use babel';

var crypto = require('crypto');
import Monitor from './monitor.js'
import Config from '../config.js'
import Logger from '../helpers/logger.js'
import ApiWrapper from '../main/api-wrapper.js';
var fs = require('fs');
var path = require('path');

export default class Sync {

  constructor(pyboard,settings,terminal) {
    this.logger = new Logger('Sync')
    this.api = new ApiWrapper()
    this.settings = settings
    this.pyboard = pyboard
    this.terminal = terminal
    this.in_raw_mode = false
    this.total_file_size = 0
    this.total_number_of_files = 0
    this.number_of_changed_files = 0
    this.method_action = "Downloading"
    this.method_name = "Download"
    this.config = Config.constants()
    this.allowed_file_types = this.settings.sync_file_types.split(',')
    for(var i = 0; i < this.allowed_file_types.length; i++) {
      this.allowed_file_types[i] = this.allowed_file_types[i].trim();
    }
    this.project_path = this.api.getProjectPath()
    this.isrunning = false
  }

  isReady(){

    // check if there is a project open
    if(!this.project_path){
      return new Error("No project open")
    }
    // check if project exists
    if(!this.exists(this.settings.sync_folder)){
        return new Error("Unable to find folder '"+this.settings.sync_folder+"'. Please add the correct folder in your settings")
    }

    return true
  }

  exists(dir){
    return fs.existsSync(this.project_path + "/" + dir)
  }

  progress(text,count){
    if(this.isrunning){
      if(count){
        this.progress_file_count += 1
        text = "["+this.progress_file_count+"/"+this.number_of_changed_files+"] " + text
      }
      var _this = this
      setTimeout(function(){
        _this.terminal.writeln(text)
      },0)
    }

  }

  sync_done(err){
    this.isrunning = false
    var mssg = this.method_name+" done"
    if(err){
      mssg = this.method_name+" failed."
      mssg += err.message && err.message != "" ? ": "+err.message : ""
      if(this.in_raw_mode){
        mssg += " Please reboot your device manually."
      }
    }else if(this.in_raw_mode){
      mssg += ", resetting board..."
    }

    this.terminal.writeln(mssg)

    if(this.pyboard.connected && !this.in_raw_mode){
      this.terminal.writePrompt()
    }

    this.oncomplete()
  }

  reset_values(oncomplete,method){

    // prepare variables
    if(method!='receive'){
      method = 'send'
      this.method_action = "Uploading"
      this.method_name = "Upload"
    }
    this.method = method
    this.oncomplete = oncomplete
    this.total_file_size = 0
    this.total_number_of_files = 0
    this.number_of_changed_files = 0
    this.progress_file_count = 0
    this.isrunning = true
    this.in_raw_mode = false

    this.project_path = this.api.getProjectPath()
    this.project_name = this.project_path.split('/').pop()
    var dir = this.settings.sync_folder.replace(/^\/|\/$/g, '') // remove first and last slash
    this.py_folder = this.project_path + "/"
    if(dir){
      this.py_folder += dir+"/"
    }

    this.files = null
    this.file_hashes = null

    var sync_folder = this.settings.sync_folder
    var folder_name = sync_folder == "" ? "main folder" : sync_folder
    this.folder_name = folder_name


    this.files = this._getFiles(this.py_folder)
    this.file_hashes = this._getFilesHashed(this.files)
  }

  check_file_size(){
    if(this.method == 'send' && this.total_file_size > this.config.max_sync_size){
      var mssg = "Total size of "+this.total_number_of_files.toString()+" files too big ("+parseInt(this.total_file_size/1000).toString()+"kb). Reduce the total filesize to < 350kb or select the correct sync folder in the settings"
      throw new Error(mssg)
    }
  }


  start(oncomplete){
    this.__start_sync(oncomplete,'send')
  }

  start_receive(oncomplete){
    this.__start_sync(oncomplete,'receive')
  }

  __start_sync(oncomplete,method){
    this.logger.info("Start sync method "+method)
    var _this = this

    var cb = function(err){
      _this.sync_done(err)
    }

    try {
      this.reset_values(oncomplete,method)
    } catch(e){
      console.log(e)
      this.sync_done(e)
      return
    }


    // make sure next messages will be written on a new line
    this.terminal.enter()

    // check if project is ready to sync
    var ready = this.isReady()
    if(ready instanceof Error){
      console.log("Not ready")
      this.sync_done(ready)
      return
    }

    // start sync
    this.terminal.write(this.method_action+" project ("+this.folder_name+")...\r\n")

    try {
      this.check_file_size()
    } catch(e){
      console.log(e)
      this.sync_done(e)
      return
    }

    this.logger.silly("Start monitor")

    this.start_monitor(function(err){
      _this.in_raw_mode = true
      _this.logger.silly("Entered raw mode")

      if(err || !_this.isrunning){
        console.log(err)
        _this.throwError(cb,err)
        _this.exit(function(){
          // do nothing, callback with error has already been called
        })

      }else{

        console.log("Starting "+_this.method)

        if(_this.method=='receive'){
          _this.__receive(cb,err)
        }else{
          _this.__send(cb,err)
        }
      }
    })
  }

  __receive(cb,err){
    var _this = this

    _this.progress("Reading files from board")

    if(err){
      this.progress("Failed to read files from board, canceling file download")
      this.throwError(cb,err)
      return
    }

    this.monitor.listFiles(function(err,file_list){
      if(err){
        _this.progress("Failed to read files from board, canceling file download")
        _this.throwError(cb,err)
        return
      }
      _this.files = _this._getFilesRecursive("")
      var new_files = []
      var existing_files = []
      for(var i=0;i<file_list.length;i++){
        var file = file_list[i]
        if(_this.allowed_file_types.indexOf(file[0].split('.').pop()) > -1){
          if(_this.files.indexOf(file[0]) > -1){
            existing_files.push(file[0])
          }else{
            new_files.push(file[0])
          }
        }
      }
      file_list = existing_files.concat(new_files)

      var mssg = "No files found on the board to download"

      if (new_files.length > 0){
        mssg = "Found "+new_files.length+" new "+_this.plural("file",file_list.length)
      }
      if (existing_files.length > 0){
        if(new_files.length == 0){
          mssg = "Found "
        }else{
          mssg += " and "
        }
        mssg += existing_files.length+" existing "+_this.plural("file",file_list.length)
      }
      _this.progress(mssg)


      var time = Date.now()

      var checkTimeout = function(){
        if(Date.now() - time >  29000){
          _this.throwError(cb,new Error("Choice timeout (30 seconds) occurred."))
          return false
        }
        return true
      }

      var cancel = function(){
        if(checkTimeout()){
          _this.progress("Canceled")
          _this.exit(function(){
            _this.complete(cb)
          })
        }
      }

      var override = function(){
        if(checkTimeout()){
          _this.progress("Downloading "+file_list.length+" "+_this.plural("file",file_list.length)+"...")
          _this.progress_file_count = 0
          _this.number_of_changed_files = file_list.length
          _this.receive_files(0,file_list,function(){
            _this.logger.info("All items received")
            _this.progress("All items overritten")
            _this.exit(function(){
              _this.complete(cb)
            })
          })
        }
      }

      var only_new = function(){
        if(checkTimeout()){
          _this.progress("Downloading "+new_files.length+" files...")
          _this.progress_file_count = 0
          _this.number_of_changed_files = new_files.length
          _this.receive_files(0,new_files,function(){
            _this.logger.info("All items received")
            _this.progress("All items overritten")
            _this.exit(function(){
              _this.complete(cb)
            })
          })
        }
      }
      var options = {
        "Cancel": cancel,
        "Yes": override,
      }
      if(new_files.length > 0){
        options["Only new files"] = only_new
      }
      setTimeout(function(){

        if(file_list.length == 0){
          _this.exit(function(){
            _this.complete(cb)
          })
          return true
        }
        var title = "Downloading files"
        var message = mssg+". Do you want to download these files into your project ("+_this.project_name+" - "+_this.folder_name+"), overwriting existing files?"

        _this.api.confirm(title,message,options)
      },100)
    })
  }

  plural(text,number){
    return text + (number == 1 ? "" : "s")
  }

  receive_files(i,list,cb){
    var _this = this
    if(i >= list.length){
      cb()
      return
    }
    var filename = list[i]
    _this.progress("Reading "+filename,true)
    _this.monitor.readFile(filename,function(err,content){
      if(err){
        _this.progress("Failed to download "+filename)
        _this.pyboard.flush(function(){
          _this.receive_files(i+1,list,cb)
        })
      }else{
        var f = _this.py_folder + filename
        _this.ensureDirectoryExistence(f)
        var stream = fs.createWriteStream(f);
        stream.once('open', function(fd) {
          stream.write(content);
          stream.end();
          _this.pyboard.flush(function(){
            _this.receive_files(i+1,list,cb)
          })
        });
      }
    })
  }

  ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath)
    if (fs.existsSync(dirname)) {
      return true
    }
    this.ensureDirectoryExistence(dirname)
    fs.mkdirSync(dirname)
  }

  __send(cb,err){
    var _this = this
    this.progress("Reading file status")
    this.logger.info('Reading pymakr file')
    this.monitor.readFile('project.pymakr',function(err,content){
      if(!_this.isrunning){
        _this.throwError(cb,err)
        return
      }

      var json_content = []
      try{
        json_content = JSON.parse(content)
        err = false
      } catch(SyntaxError){
        err = true
      }
      _this.__write_changes(json_content,cb,err)
    })
  }

  __write_changes(json_content,cb,err){
    var _this = this

    if(err){
      _this.progress("Failed to read project status, uploading all files")
    }

    var changes = _this._getChangedFiles(this.file_hashes,json_content)

    var deletes = changes["delete"]
    var changed_files = changes["files"]
    var changed_folders = changes["folders"]

    _this.number_of_changed_files = changed_files.length

    if(deletes.length > 0){
      _this.progress("Deleting "+deletes.length.toString()+" files/folders")
    }

    if(deletes.length == 0 && changed_files.length == 0 && changed_folders.length == 0){
      _this.progress("No files to upload")
      _this.complete(cb)
      return
    }else{
      _this.logger.info('Removing files')
      _this.removeFilesRecursive(deletes,function(){
        _this.logger.info('Writing changed folders')
        _this.writeFilesRecursive(changed_folders,function(err){
          if(err || !_this.isrunning){
            _this.throwError(cb,err)
            return
          }

          _this.logger.info('Writing changed files')
          _this.writeFilesRecursive(changed_files,function(err){
            if(err || !_this.isrunning){
              _this.throwError(cb,err)
              return
            }
            setTimeout(function(){
              _this.logger.info('Writing project file')
              _this.monitor.writeFile('project.pymakr',JSON.stringify(_this.file_hashes),function(err){
                if(err || !_this.isrunning){
                  _this.throwError(cb,err)
                  return
                }
                _this.logger.info('Exiting...')
                _this.exit(function(){
                  _this.complete(cb)
                })
              })
            },300)
          })
        })
      })
    }
  }

  stop(){
    this.logger.info("stopped sync")
    this.isrunning = false
  }


  throwError(cb,err){
    var _this = this
    var mssg = err ? err : new Error("")
    cb(mssg)

    _this.pyboard.stopWaitingForSilent()

    var _this = this
    this.exit(function(){
      _this.pyboard.enter_friendly_repl_non_blocking(function(){
        // do nothing, this might work or not based on what went wrong when synchronizing.
      })
    })
  }

  complete(cb){
    this.exit(function(){
      cb()
    })
  }

  removeFilesRecursive(files,cb,depth){
    var _this = this
    if(!depth){ depth = 0 }
    if(files.length == 0 || depth > 60){
      cb()
    }else{
      var file = files[0]
      var filename = file[0]
      var type = file[1]
      if(type == "d"){
        _this.progress("Removing "+filename)
        _this.monitor.removeDir(filename,function(){
          files.splice(0,1)
          _this.removeFilesRecursive(files,cb,depth+1)
        })
      }else{
        _this.progress("Removing "+filename)
        _this.monitor.removeFile(filename,function(){
          files.splice(0,1)
          _this.removeFilesRecursive(files,cb,depth+1)
        })
      }
    }
  }


  writeFilesRecursive(files,cb,depth){
    if(!depth){ depth = 0 }
    if(files.length == 0 || depth > 60){
      cb()
    }else{
      var file = files[0]
      var filename = file[0]
      var type = file[1]
      var _this = this
      if(type == "f"){
        var contents = fs.readFileSync(this.py_folder + filename,'utf8')
        _this.progress("Writing file "+filename,true)
        _this.monitor.writeFile(filename,contents,function(err){
          if(err){
            cb(err)
            return
          }
          _this.pyboard.flush(function(){
            files.splice(0,1)
            _this.writeFilesRecursive(files,cb,depth+1)
          })
        })
      }else{
        _this.progress("Creating dir "+filename)
        _this.monitor.createDir(filename,function(){
          _this.pyboard.flush(function(){
            files.splice(0,1)
            _this.writeFilesRecursive(files,cb,depth+1)
          })
        })
      }
    }
  }

  start_monitor(cb){
    this.monitor = new Monitor(this.pyboard,cb,this.method)
  }

  _getFiles(dir){
    return fs.readdirSync(dir)
  }

  _getFilesRecursive(dir){
    var files = fs.readdirSync(this.py_folder+dir)
    var list = []
    for(var i=0;i<files.length;i++){
      var filename = dir + files[i]
      var file_path = this.py_folder + filename
      var stats = fs.lstatSync(file_path)
      if(!stats.isDirectory()){
        list.push(filename)
      }else{
        list = list.concat(this._getFilesRecursive(filename+"/"))
      }
    }
    return list
  }

  _getFilesHashed(files,path){
    if(!path){
      path = ""
    }
    var file_hashes = []

    for(var i=0;i<files.length;i++){
      var filename = path + files[i]
      if(filename.length > 0 && filename.substring(0,1) != "." && files[i].substring(0,1) != "." && files[i].length > 0){
        var file_path = this.py_folder + filename
        var stats = fs.lstatSync(file_path)
        if(stats.isDirectory()){
          var files_from_folder = this._getFiles(file_path)
          if(files_from_folder.length > 0){
            var hash = crypto.createHash('sha256').update(filename).digest('hex')
            file_hashes.push([filename,"d",hash])
            file_hashes = file_hashes.concat(this._getFilesHashed(files_from_folder,filename+"/"))
          }
        }else if(this.allowed_file_types.indexOf(filename.split('.').pop()) > -1){
          this.total_file_size += stats.size
          this.total_number_of_files += 1
          var contents = fs.readFileSync(file_path,'utf8')
          var hash = crypto.createHash('sha256').update(contents).digest('hex')
          file_hashes.push([filename,"f",hash])
        }
      }
    }
    return file_hashes
  }

  _getChangedFiles(hashes,board_hashes){
    var changed_files = []
    var changed_folders = []
    var deletes = []
    for(var i=0;i<hashes.length;i++){
      var h = hashes[i]
      var found = false
      for(var j=0;j<board_hashes.length;j++){
        var bh = board_hashes[j]
        if(h[0] == bh[0]){
          if (h[2] != bh[2]){
            if(h[1] == "f"){
              changed_files.push(h)
            }else{
              changed_folders.push(h)
            }
          }
          found = true
          board_hashes.splice(j,1)
          break;
        }
      }
      if(!found){
        if(h[1] == "f"){
          changed_files.push(h)
        }else{
          changed_folders.push(h)
        }
      }
    }
    for(var i=0;i<board_hashes.length;i++){
      deletes.push(board_hashes[i])
    }
    return {'delete': deletes, 'files': changed_files,'folders': changed_folders}
  }

  exit(cb){
    this.monitor.exit(cb)
  }
}
