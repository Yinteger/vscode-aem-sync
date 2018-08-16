// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
var watcher = require("./watcher.js");
var Sync = require("./sync.js");
var packager = require("./packager.js");
var Queue = require("./queue.js");

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
    }

    activate(context) {
        var config = vscode.workspace.getConfiguration('aemsync');
        this.host = config.get("host"); //Host to connect to
        this.port = config.get("port"); //Port to connect to
        this.username = config.get("username"); //Username to connect with
        this.password = config.get("password"); //Password to connect with
    
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
            this.onFileChange(fullPath, "add");
        });
        watcher.on("delete", (file, fullPath) => {
            this.onFileChange(fullPath, "delete");
        });
        watcher.on("change", (file, fullPath) => {
            this.onFileChange(fullPath, "change");
        });
    
        console.log('AEM-Sync now running targetting ', this.host);
    
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with  registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('extension.sayHello', function () {
            // The code you place here will be executed every time your command is executed
    
            // Display a message box to the user
            vscode.window.showInformationMessage('Hello World!');
        });
    
        context.subscriptions.push(disposable);
    }

    onFileChange (fullPath, eventType) {
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
        }, 1000);
    }

    syncQueueToAEM () {
        var queueItems = this.queue.empty();

        //Debug
        //queueItems = ["c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\accordion\\accordion.html", "c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\accordion\\accordion.js", "c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\alert\\clientlibs\\js\\alert.js"];
        
        this.output.appendLine("Attempting to sync " + queueItems.length + " item(s) to AEM");
        console.log("Syncing queue to AEM", queueItems);
        //Build the package
        packager.buildPackage(queueItems).then((packagePath) => {
            //Sync the package to AEM
            Sync.syncPackage(packagePath, this.host, this.port, this.username, this.password).then(() => {
                //Dispose the 'syncing' message
                this.statusDisposable.dispose();

                console.log("Queue synced successfully");
                this.output.appendLine("Synced " + queueItems.length + " item(s) to AEM");
                //List each change into the log
                queueItems.forEach((queueItem) => {
                    var operString = "";
                    switch (queueItem.type) {
                        case "delete":
                            operString = "D";
                            break;
                        case "change":
                            operString = "M";
                            break;
                        case "add":
                            operString = "A";
                            break;
                    }
                    this.output.appendLine(operString + " " + queueItem.path);
                });

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
}

var extension = new Extension();

exports.activate = extension.activate.bind(extension);

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;