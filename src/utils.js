class Utils {
        //Clean a system path and convert to AEM Path
        convertPathToAem(path) {
            if (path.indexOf("jcr_root\\") > -1) {
                return "/" + path.split('jcr_root\\')[1].replace(/\\/g, "/");
            } else if (path.indexOf("jcr_root/") > -1) {
                return "/" + path.split("jcr_root/")[1].replace(/\\/g, "/");
            }
        }
}

module.exports = new Utils();