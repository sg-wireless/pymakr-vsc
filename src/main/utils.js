var vscode = require('vscode');
var path = require('path');
var os = require('os');
var homeDir = os.homedir();

export default class Utils{
    
    static getConfigPath(filename){
        var folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.platform == 'linux' ? joinPath(homeDir, '.config') : '/var/local');
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
}
