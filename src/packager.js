const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const FILTER_PREFIX = '<?xml version="1.0" encoding="UTF-8"?><workspaceFilter version="1.0">';
const FILTER_SUFFIX = '</workspaceFilter>';
const os = require('os')

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
                    archive.file(operation.path, {name: "jcr_root" + this.convertPathToAem(operation.path)});

                    var dir = path.dirname(operation.path);
                    while (dir) {
                        if (fs.existsSync(dir + "\\.content.xml") && contentXMLs.indexOf(dir + "\\.content.xml") === -1) {
                            contentXMLs.push(dir + "\\.content.xml");
                            //If the operation was delete, just omit from package
                            if (operation.type != "delete") {
                                archive.file(dir + "\\.content.xml", {name: "jcr_root" + this.convertPathToAem(dir + "\\.content.xml")});
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
            filters.push('<filter root="' + this.convertPathToAem(operation.path) + '"/>');
        });
        return FILTER_PREFIX + filters.join("") + FILTER_SUFFIX;
    }
    //Clean a system path and convert to AEM Path
    convertPathToAem(path) {
        if (path.indexOf("jcr_root\\") > -1) {
            return "/" + path.split('jcr_root\\')[1].replace(/\\/g, "/");
        } else if (path.indexOf("jcr_root/") > -1) {
            return "/" + path.split("jcr_root/")[1].replace(/\\/g, "/");
        }
        
    }
    //Clear the package file from the system
    clearPackage () {
        fs.unlink(__dirname + '/sync.zip', (err) => {
            //Do something...
        });
    }
}

module.exports = new Packager();