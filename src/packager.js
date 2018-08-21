const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const FILTER_PREFIX = '<?xml version="1.0" encoding="UTF-8"?><workspaceFilter version="1.0">';
const FILTER_SUFFIX = '</workspaceFilter>';
const os = require('os')
const utils = require("./utils.js");

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
                archive.append(Buffer.from(this.buildFilter(operations)), {name: "META-INF/vault/filter.xml"});

                //Add all the actual files
                operations.forEach((operation) => {
                    if (fs.existsSync(operation.path)) {
                        archive.file(operation.path, {name: "jcr_root" + utils.convertPathToAem(operation.path)});
                        if (fs.lstatSync(operation.path).isDirectory()) {
                            //If directory, recursively add all children to package as well
                            this.addDirectoryToPackage(archive, operation.path);
                        }
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
            filters.push('<filter root="' + utils.convertPathToAem(operation.path) + '"/>');
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
            archive.file(file, {name: "jcr_root" + utils.convertPathToAem(file)});
            if (fs.lstatSync(file).isDirectory()) {
                //If directory, recursively add all children to package as well
                this.addDirectoryToPackage(archive, file);
            }
        });
    }
}

module.exports = new Packager();