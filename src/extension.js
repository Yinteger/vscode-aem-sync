// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const jcrCrawler = require("./jcrCrawler");
var watcher = require("./watcher.js");
var Sync = require("./sync.js");
var packager = require("./packager.js");
var Queue = require("./queue.js");
const fs = require('fs');
const utils = require("./utils.js");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
class Extension {
    constructor () {
        this.output = vscode.window.createOutputChannel("aemsync");
        this.statusDisposable = null;
        this.queue = new Queue();//Queue of files that need to be synced
        this.timeout = null;
        this.host = null;
        this.port = null;
        this.username = null;
        this.password = null;
        this.syncDelay = null;
    }

    activate(context) {
        var config = vscode.workspace.getConfiguration('aemsync');
        this.host = config.get("host"); //Host to connect to
        this.port = config.get("port"); //Port to connect to
        this.username = config.get("username"); //Username to connect with
        this.password = config.get("password"); //Password to connect with
        this.syncDelay = config.get("syncDelay"); //Delay between a file change and syncing
    
        //Create output log
        this.output.appendLine("AEM Sync started... Searching for jcr_root");
        
        //Start the File watcher
        watcher.start(vscode.workspace.workspaceFolders).then((watchedPaths) => {
            console.log(watchedPaths);
            if (watchedPaths.length > 0) {
                watchedPaths.forEach((watchedPath) => {
                    this.output.appendLine("AEM Sync now watching for changes inside  " + watchedPath);
                });
            } else {
                this.output.appendLine("AEM Sync was unable to find any jcr_root directories!");
            }
        });
    
        //Display start status to user
        vscode.window.setStatusBarMessage('AEM Sync now watching files', 7500);
        this.output.show();
    
        //Add file watcher event listeners
        watcher.on("add", (file, fullPath) => {
            this._addNodeToQueue(fullPath, "add");
        });
        watcher.on("delete", (file, fullPath) => {
            this._addNodeToQueue(fullPath, "delete");
        });
        watcher.on("change", (file, fullPath) => {
            this._addNodeToQueue(fullPath, "change");
        });
    
        console.log('AEM-Sync now running targetting ', this.host);
    }

    deactivate () {
        watcher.stop();
        this.output.appendLine("AEM Sync deactivated; stopping file watchers (Syncs in progress will continue)");
    }

    _addNodeToQueue (fullPath, eventType) {
        console.log("File operation on ", fullPath, " with type ", eventType);

        //Show a Syncing to AEM message to user
        if (this.statusDisposable) {
            this.statusDisposable.dispose();
        }
        this.statusDisposable = vscode.window.setStatusBarMessage('Syncing to AEM');
        
        //Add to queue
        if (!this.queue.has(fullPath)) { //TODO this may cause issues when multiple types of operations happen on a single file (change, then delete -- Only first operation gets)
            this.queue.addOperation(fullPath, eventType);   
        }

        clearTimeout(this.timeout);

        //Set a timeout so multiple changes around the sametime happen in one sync
        this.timeout = setTimeout(() => {
            this.syncQueueToAEM();
        }, this.syncDelay);
    }

    syncQueueToAEM () {
        var queueItems = this.queue.empty();

        //Debug
        //queueItems = ["c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\accordion\\accordion.html", "c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\accordion\\accordion.js", "c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\alert\\clientlibs\\js\\alert.js"];
        
        this.output.appendLine("Attempting to sync to AEM");
        console.log("Syncing queue to AEM", queueItems);
        //Build the package
        packager.buildPackage(queueItems).then((packagePath) => {
            //Sync the package to AEM
            Sync.syncPackage(packagePath, this.host, this.port, this.username, this.password).then((response) => {
                //Dispose the 'syncing' message
                this.statusDisposable.dispose();

                console.log("Queue synced successfully");
                //Grab changeset from response
                this.output.append(response.split("Importing content...")[1].split("Package imported")[0]);
                //this.output.appendLine("Synced " + queueItems.length + " item(s) to AEM");
                //List each change into the log
                // queueItems.forEach((queueItem) => {
                //     var operString = "";
                //     switch (queueItem.type) {
                //         case "delete":
                //             operString = "D";
                //             break;
                //         case "change":
                //             operString = "M";
                //             break;
                //         case "add":
                //             operString = "A";
                //             break;
                //     }
                //     this.output.appendLine(operString + " " + queueItem.path);
                // });

                //Notify user of the success
                vscode.window.setStatusBarMessage('Changes synced to AEM', 3000);

                //Remove the package from the local filesystem
                packager.clearPackage();
            }, (error) => {
                //Error on sync
                console.error(error);
                this.statusDisposable.dispose();
                vscode.window.showErrorMessage(error);
            })
        }, (error) => {
            //Error on packaging
            this.statusDisposable.dispose();
            vscode.window.showErrorMessage(error);
            console.error(error);
        });
    }

    syncNodeToAEM (context) {
        vscode.window.showWarningMessage("Syncing TO AEM will overwrite nodes in the JCR, are you sure you want to continue? \r\n Syncing to " + utils.convertPathToAem(context.fsPath), "Yes", "No").then((response) => {
            if (response === "Yes") {
                this._addNodeToQueue(context.fsPath, "overwrite");
            }
        });
    }

    syncNodeFromAEM (context) {
        //Get tree
        vscode.window.showWarningMessage("Syncing FROM AEM will overwrite local files, are you sure you want to continue? \r\n Syncing from " + utils.convertPathToAem(context.fsPath), "Yes", "No").then((response) => {
            if (response === "Yes") {
                console.log(context);
                jcrCrawler.getTree(utils.convertPathToAem(context.fsPath), this.host, this.port, this.username, this.password).then((nodes) => {
                    //Traverse tree and compare to local file system
                    this.importNode(nodes, context.fsPath);
                }, (err) => {
                    console.error("error crawling jcr tree");
                });
            }
        });
    }

    importNode (node, systemPath) {

    } 

    _addFileToQueueold(path, operationType, addAllChildren) {
        //Add to queue
        if (!this.queue.has(path)) { //TODO this may cause issues when multiple types of operations happen on a single file (change, then delete -- Only first operation gets)
            this.queue.addOperation(path, operationType);   
        }

        if (addAllChildren && fs.lstatSync(path).isDirectory()) {
            console.log("Trying to sync a directory");
            jcrCrawler.getTree(utils.convertPathToAem(path), this.host, this.port, this.username, this.password).then((jcrTree) => {
                console.log(jcrTree);
                //Start comparing Local file system against the tree to see what needs to be synced (if anything)
            }, (err) => {
                console.error(err);
            });
            //Is a directory, add all of it's children to the queue


            //Get Children

            //Look through children and start recursion
        }
    }
}

var extension = new Extension();

exports.activate = extension.activate.bind(extension);
exports.deactivate = extension.deactivate.bind(extension);
vscode.commands.registerCommand('aemsync.start', extension.activate.bind(extension));
vscode.commands.registerCommand("aemsync.stop", extension.deactivate.bind(extension));
vscode.commands.registerCommand("aemsync.syncToAEM",extension.syncNodeToAEM.bind(extension));
vscode.commands.registerCommand("aemsync.syncFromAEM",extension.syncNodeFromAEM.bind(extension));