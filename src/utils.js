//A list of filenames in AEM that map to a specific Node name and must be imported with the node name
const fs = require('fs');
const jcrFileToNodeNames = {
    "_cq_": "cq:",
    "_rep_": "rep:"
};


class Utils {
        //Clean a system path and convert to AEM Path
        convertPathToAem(path, preserveFilename) {
            var aemPath = "";

            if (path.indexOf("jcr_root\\") > -1) {
                aemPath =  "/" + path.split('jcr_root\\')[1].replace(/\\/g, "/");
            } else if (path.indexOf("jcr_root/") > -1) {
                aemPath =  "/" + path.split("jcr_root/")[1].replace(/\\/g, "/");
            }

            var splitPath = aemPath.split("/");
            var OriginalnodeName = splitPath[splitPath.length - 1];
            var nodeName = OriginalnodeName.replace("", "");

            if (!preserveFilename) {
                for (var key in jcrFileToNodeNames) {
                    nodeName = nodeName.replace(key, jcrFileToNodeNames[key]);
                };
    
                //If XML file, look into to it to see if it's a node or not (Nodes we must strip .xml from the path)
                //@TODO: This method won't work on deletion of nodes since file no longer exists... 
                if (fs.existsSync(path) && nodeName != ".content.xml" && nodeName.indexOf(".xml") > -1) {
                    var nodeData = fs.readFileSync(path);
                    if (nodeData.indexOf("<jcr:root ") > -1) {
                        nodeName = nodeName.replace(".xml", "");
                        console.log("Found a node xml file, removing .xml from path", nodeName);
                    }
                }
                
                aemPath = aemPath.replace(OriginalnodeName, nodeName);
            }

            console.log(aemPath);
            return aemPath;
        }
}

module.exports = new Utils();