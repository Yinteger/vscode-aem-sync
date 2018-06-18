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
        if (workspaces && workspaces.length > 0) {
            workspaces.forEach((workspace) => {
                console.log("Starting search in ", workspace.uri.fsPath);
                find.dir('jcr_root',workspace.uri.fsPath, (dirs) => {
                    dirs.forEach((dir) => {
                        if (path.basename(dir) === "jcr_root") {
                            this.watchers.push(fs.watch(dir, {'recursive': true}, (eventType, fileName) => {
                                this.emit(eventType, fileName, path.join(dir, fileName.toString()));
                            }));
                            console.log("Now watching ", dir, " folder");
                        }
                    });
                });
                
            });
        } else {
            console.warn("There are no workspaces for AEM-Sync to watch");
            return false;
        }
    }
    //Stops watching the JCR root directories
    stop () {

    }
};

module.exports = new Watcher();