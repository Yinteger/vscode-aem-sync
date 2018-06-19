const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const FILTER_PREFIX = '<?xml version="1.0" encoding="UTF-8"?><workspaceFilter version="1.0">';
const FILTER_SUFFIX = '</workspaceFilter>';
const os = require('os')

//Packages up changes and deploys to AEM
class Packager {
    //Takes in File Location(s) and builds a single deployable aem package
    buildPackage(paths) {
        //Build an AEM Package! Yay!
        let archive = archiver('zip');
        var output = fs.createWriteStream(path.join(os.tmpdir(), "sync.zip"));
        archive.pipe(output);

        //Add base package files
        archive.directory(__dirname + '/base_package/', false);
        
        //Build Filter.xml and add it
        archive.append(Buffer.from(this.buildFilter(paths)), {name: "META-INF/vault/filter.xml"});

        //Add all the actual files
        paths.forEach((_path) => {
            archive.file(_path, {name: "jcr_root" + this.convertPathToAem(_path)});

            var dir = path.dirname(_path);
            while (dir) {
                if (fs.existsSync(dir + "\\.content.xml")) {
                    archive.file(dir + "\\.content.xml", {name: "jcr_root" + this.convertPathToAem(dir + "\\.content.xml")});
                }
                var splitDir = dir.split("\\");
                dir = splitDir.slice(0, splitDir.length - 1).join("\\");
            }
           
        });

        console.log("finalize"); 
        archive.finalize();
        return path.join(os.tmpdir(), "sync.zip");
    }
    //Build the filter.xml content
    buildFilter(paths) {
        var filters = [];

        paths.forEach((path) => {
            filters.push('<filter root="' + this.convertPathToAem(path) + '"/>');
        });
        return FILTER_PREFIX + filters.join("") + FILTER_SUFFIX;
    }
    //Clean a system path and convert to AEM Path
    convertPathToAem(path) {
        return "/" + path.split('jcr_root\\')[1].replace(/\\/g, "/");
    }
    //Clear the package file from the system
    clearPackage () {
        fs.unlink(__dirname + '/sync.zip', (err) => {
            //Do something...
        });
    }
}

module.exports = new Packager();