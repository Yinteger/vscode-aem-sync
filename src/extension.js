// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
var watcher = require("./watcher.js");
var Sync = require("./sync.js");
var packager = require("./packager.js");
var Queue = require("./queue.js");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var config = vscode.workspace.getConfiguration('aemsync');
    var host = config.get("host"); //Host to connect to
    var port = config.get("port"); //Port to connect to
    var username = config.get("username"); //Username to connect with
    var password = config.get("password"); //Password to connect with
    var timeout;
    var statusDisposable;
    var queue = new Queue();//Queue of files that need to be synced

    var output = vscode.window.createOutputChannel("aemsync");
    output.appendLine("AEM Sync started... Searching for jcr_root");
    //Start watching
    watcher.start(vscode.workspace.workspaceFolders).then((watchedPaths) => {
        console.log(watchedPaths);
        if (watchedPaths.length > 0) {
            watchedPaths.forEach((watchedPath) => {
                output.appendLine("AEM Sync now watching for changes inside  " + watchedPath);
            });
        } else {
            output.appendLine("AEM Sync was unable to find any jcr_root directories!");
        }
    });
    vscode.window.setStatusBarMessage('AEM Sync now watching files', 7500);

    output.show();
    watcher.on("change", (file, fullPath) => {
        if (statusDisposable) {
            statusDisposable.dispose();
        }
        statusDisposable = vscode.window.setStatusBarMessage('Syncing to AEM');
        //Sync simply the new file
        //console.log("changed ", file, fullPath);
        if (!queue.has(fullPath)) {
            queue.addItem(fullPath);   
        }
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            var queueItems = queue.empty();
            //Debug
            //queueItems = ["c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\accordion\\accordion.html", "c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\accordion\\accordion.js", "c:\\projects\\aem\\alc\\ui.apps\\src\\main\\content\\jcr_root\\apps\\alc\\components\\alert\\clientlibs\\js\\alert.js"];
            
            output.appendLine("Attempting to sync " + queueItems.length + " item(s) to AEM");
            console.log("Syncing queue to AEM", queueItems);
            packager.buildPackage(queueItems).then((packagePath) => {
                Sync.syncPackage(packagePath, host, port, username, password).then(() => {
                    statusDisposable.dispose();
                    console.log("Queue synced successfully");
                    queueItems.forEach((queueItem) => {
                        output.appendLine("Synced " + queueItem + " to AEM");
                    });
                    vscode.window.setStatusBarMessage('Changes synced to AEM', 3000);
                }, (error) => {
                    console.error(error);
                    statusDisposable.dispose();
                    vscode.window.showErrorMessage(error);
                })
            }, (error) => {
                statusDisposable.dispose();
                vscode.window.showErrorMessage(error);
                console.error(error);
            });
        }, 1000);
    });
    
    watcher.on('rename', (file) => {
        //Sync the entire parent folder
        console.log("renamed ", file);
    });

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('AEM-Sync now running targetting ', host);

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
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;