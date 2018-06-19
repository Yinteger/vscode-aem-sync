//Sync a package to the AEM server
const PACKAGEMGR_PATH = "/crx/packmgr/service.jsp";
const fs = require('fs');
var rp = require('request-promise');
rp.debug = true;
const parseUrl = require('url').parse

class Sync {
    syncPackage(packagePath, host, port, username, password) {
        var url = parseUrl("http://" + username + ":" + password + "@" + host + ":" + port + PACKAGEMGR_PATH);
        var auth = Buffer.from(url.auth).toString('base64');
        var cleanURL = "http://" + url.host + url.path;
        console.log('Basic ' + auth);
        console.log(cleanURL);
        return new Promise((resolve, reject) => {
            rp({uri: cleanURL, formData: {
                "file": fs.createReadStream(packagePath),
                "force": "true",
                "install": "true"
            }, method: "POST", headers: {'Authorization': 'Basic ' + auth}}).then((resp) => {
                console.log(resp);
            }).catch((err) => {
                console.error(err);
            })
        });
    }
}

module.exports = new Sync();