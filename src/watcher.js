const EventEmitter = require('events');
const fs = require('fs');
var find = require("find");
var path = require('path');

class Watcher extends EventEmitter {
    constructor () {
        super();
        this.watching = false;
        this.watchers = [];
    }
    //Does a search of the workspaces and finds the JCR root directories and watches them for changes
    start (workspaces) {
        return new Promise((resolve, reject) => {
            if (workspaces && workspaces.length > 0) {
                workspaces.forEach((workspace) => {
                    console.log("Starting search in ", workspace.uri.fsPath);
                    var paths = [];
                    find.dir('jcr_root',workspace.uri.fsPath, (dirs) => {
                        dirs.forEach((dir) => {
                            if (path.basename(dir) === "jcr_root") {
                                paths.push(dir);
                                this.watchers.push(fs.watch(dir, {'recursive': true}, (eventType, fileName) => {
                                    var fullPath = path.join(dir, fileName.toString());
                                    if ((eventType === "change" && !fs.lstatSync(fullPath).isDirectory()) || eventType === "rename") {
                                        if (eventType === "rename") {
                                            //Check if file exists or not
                                            eventType = fs.existsSync(fullPath) ? "add" : "delete";
                                        }
                                        this.emit(eventType, fileName, fullPath);
                                    }
                                }));
                                console.log("Now watching ", dir, " folder");
                            }
                        });
                        resolve(paths);
                    });
                });
            }
        });
    }
    //Stops watching the JCR root directories
    stop () {

    }
};

module.exports = new Watcher();