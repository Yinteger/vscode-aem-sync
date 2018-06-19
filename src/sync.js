//Sync a package to the AEM server
const PACKAGEMGR_PATH = "/crx/packmgr/service.jsp";
const FormData = require('form-data');
const fs = require('fs');
var rp = require('request-promise');

class Sync {
    syncPackage(packagePath, host, port, username, password) {
        return new Promise((resolve, reject) => {
            rp({url:"http://" + username + ":" + password + "@" + host + ":" + port + PACKAGEMGR_PATH, formData: {
                file: fs.createReadStream(packagePath),
                force: "true",
                install: "true"
            }, method: "POST"}).then((resp) => {
                console.log(resp);
            }).catch((err) => {
                console.error(err);
            })
        });
    }
}

module.exports = new Sync();