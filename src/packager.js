const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const FILTER_PREFIX = '<?xml version="1.0" encoding="UTF-8"?><workspaceFilter version="1.0">';
const FILTER_SUFFIX = '</workspaceFilter>';
const os = require('os')
const utils = require("./utils.js");
const vscode = require('vscode');

//Packages up changes and deploys to AEM
class Packager {
    //Takes in File Location(s) and builds a single deployable aem package
    buildPackage(operations) {
        return new Promise((resolve, reject) => {
            try {
                //Build an AEM Package! Yay!
                let archive = archiver('zip');
                var outputPath = path.join(os.tmpdir(), "sync.zip");
                var output = fs.createWriteStream(outputPath);
                var contentXMLs = []; //Keep track of contentXML's we add so we don't add multiple for the same node
                archive.pipe(output);

                //Add base package files
                archive.directory(__dirname + '/base_package/', false);
                
                //Build Filter.xml and add it
                var filterString = this.buildFilter(operations);
                console.log(filterString);  
                archive.append(Buffer.from(filterString), {name: "META-INF/vault/filter.xml"});

                //Add all the actual files
                operations.forEach((operation) => {
                    if (fs.existsSync(operation.path)) {
                        var aemPath = utils.convertPathToAem(operation.path);
                        if (aemPath.indexOf("content.xml") && aemPath.split("/").length == 3) {
                            //Trying to edit the content.xml of a root folder
                            //ABORT because of a particular issue in AEM where it'll actually remove
                            //All the files in the root folder
                            //Only happens with root folders (/etc, /apps for example); not sure why
                            vscode.window.showErrorMessage("Refusing to sync " + aemPath + " due to an issue syncing root level content.xml files (see issue #...)");
                            return false;
                        }
                        var splitAEMPath = aemPath.split("/");
                        archive.file(operation.path, {name: "jcr_root" + utils.convertPathToAem(operation.path, true)});
                        if (operation.path.indexOf(".content.xml") > -1) {
                            contentXMLs.push( path.dirname(operation.path) + "\\.content.xml");
                        }
                        if (fs.lstatSync(operation.path).isDirectory()) {
                            //If directory, recursively add all children to package as well
                            this.addDirectoryToPackage(archive, operation.path);
                        }
                        // else if (splitAEMPath[splitAEMPath.length - 1] === ".content.xml") {
                        //     //If it's the .content.xml, sync entire node
                        //     this.addDirectoryToPackage(archive, operation.path.replace("content.xml", ""));
                        // }
                    }                        

                    //Add all the content.xml files leading up to it
                    var dir = path.dirname(operation.path);
                    while (dir) {
                        if (fs.existsSync(dir + "\\.content.xml") && contentXMLs.indexOf(dir + "\\.content.xml") === -1) {
                            contentXMLs.push(dir + "\\.content.xml");
                            //If the operation was delete, just omit from package
                            if (operation.type != "delete") {
                                archive.file(dir + "\\.content.xml", {name: "jcr_root" + utils.convertPathToAem(dir + "\\.content.xml")});
                            }
                        }
                        var splitDir = dir.split("\\");
                        dir = splitDir.slice(0, splitDir.length - 1).join("\\");
                    }
                
                });

                output.on("close", () => {
                    resolve(outputPath);
                });

                archive.finalize();
            } catch (err) {
                reject(err);
            }
        });
    }
    //Build the filter.xml content
    buildFilter(operations) {
        var filters = [];

        operations.forEach((operation) => {
            var aemPath = utils.convertPathToAem(operation.path);
            var aemPathSplit = aemPath.split("/");
            if (aemPath.indexOf("content.xml") > -1 && aemPathSplit.length === 3) {
                //Trying to edit the content.xml of a root folder
                //ABORT because of a particular issue in AEM where it'll actually remove
                //All the files in the root folder
                //Only happens with root folders (/etc, /apps for example); not sure why
                return false;
            }
            if (aemPathSplit[aemPathSplit.length - 1] === ".content.xml") {
                //If changing the .content.xml file, we need to sync the entire node
                var newAemPath = aemPath.replace("/.content.xml", "");
                if (newAemPath === "") {
                    //Root
                    newAemPath = "/*";
                }
                var filterString = '<filter root="' + newAemPath + '">';
                //Build an exclude list manually... This is to fix an issue with pushing up the content.xml emptying all other files.. Doing include on the node only fixes it except for root nodes
                // var dir = path.dirname(operation.path);
                // fs.readdirSync(dir).forEach(file => {
                //     if (file != ".content.xml") {
                //         filterString += "<exclude pattern=\"" + utils.convertPathToAem(path.join(dir, file)) + "\" />";
                //     }
                // });
                filterString += "<include pattern=\"" + newAemPath + "\" />";
                filterString += "</filter>";
                filters.push(filterString);
            } else {
                filters.push('<filter root="' + aemPath + '"/>');
            }
        });
        return FILTER_PREFIX + filters.join("") + FILTER_SUFFIX;
    }
    //Clear the package file from the system
    clearPackage () {
        fs.unlink(__dirname + '/sync.zip', (err) => {
            //Do something...
        });
    }
    addDirectoryToPackage (archive, directory) {
        fs.readdirSync(directory).forEach(file => {
            file = path.join(directory, file);
            console.log(file);
            archive.file(file, {name: "jcr_root" + utils.convertPathToAem(file, true)});
            if (fs.lstatSync(file).isDirectory()) {
                //If directory, recursively add all children to package as well
                this.addDirectoryToPackage(archive, file);
            }
        });
    }
}

module.exports = new Packager();
