// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
var watcher = require("./watcher.js");
var Sync = require("./sync.js");
var packager = require("./packager.js");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var config = vscode.workspace.getConfiguration('aemsync');
    var target = config.get("server");
    var timeout;
    //Start watching
    watcher.start(vscode.workspace.workspaceFolders);

    watcher.on("change", (file, fullPath) => {
        vscode.window.setStatusBarMessage('Syncing to AEM', new Promise((resolve, reject) => {
            //Sync simply the new file
            console.log("changed ", file, fullPath);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                packager.buildPackage([fullPath]);
                packager.clearPackage();
                resolve();
                vscode.window.setStatusBarMessage('Changes synced to AEM', 3000);
            }, 1000);
        }));
    });
    
    watcher.on('rename', (file) => {
        //Sync the entire parent folder
        console.log("renamed ", file);
    });

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('AEM-Sync now running targetting ', target);

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