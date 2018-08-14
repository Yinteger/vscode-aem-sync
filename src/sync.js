//Sync a package to the AEM server
var PACKAGEMGR_PATH = "/crx/packmgr/service.jsp";
const fs = require('fs');
const http = require('http');

class Sync {
    syncPackage(packagePath, hostname, port, username, password) {
        return new Promise((resolve, reject) => {
            console.log(packagePath);
            fs.readFile(packagePath, function (err, fileBuffer) {
                if (err) {
                    console.error("Error reading package zip \r\n", err);
                    reject("Error reading package zip file: " + err);
                }
    
                var body = Buffer.concat([
                    Buffer.from("----------------------------553807080757934961515820\r\nContent-Disposition: form-data; name=\"install\"\r\n\r\ntrue\r\n----------------------------553807080757934961515820\r\nContent-Disposition: form-data; name=\"force\"\r\n\r\ntrue\r\n----------------------------553807080757934961515820\r\nContent-Disposition: form-data; name=\"file\"; filename=\"sync.zip\"\r\nContent-Type: application/zip\r\n\r\n", "utf-8"),
                    new Buffer(fileBuffer, 'binary'),
                    Buffer.from("\r\n----------------------------553807080757934961515820--\r\n", "utf-8"),
                ]);
    
                //File Contents to body
                const options = {
                    hostname,
                    port,
                    encoding: null,
                    path: PACKAGEMGR_PATH,
                    method: "POST",
                    auth: username + ":" + password,
                    headers: {
                        'content-type': 'multipart/form-data; boundary=--------------------------553807080757934961515820',
                        'content-length': Buffer.byteLength(body),
                        'connection': 'keep-alive',
                        'accept': '*/*'
                    }
                };
        
                const req = http.request(options, (res) => {
                    var responseBody = "";
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        responseBody += chunk;
                    });
                    res.on('end', () => {
                        //Check for a specific string since AEM returns 200 even on errors
                        if (responseBody.indexOf('Package imported.') > -1) {
                            console.log(responseBody);
                            resolve();
                        } else {
                            console.error("Error importing Package to AEM: \r\n", responseBody);
                            reject("Error importing package into AEM: " + responseBody);
                        }
                    });
                });
        
                req.on('error', (e) => {
                    console.error(`problem with request: ${e.message}`);
                    reject("Error connecting to AEM server: " + e.message);
                });
                  
                // write data to request body
                req.write(body);
                req.end();
            });
        });
    }
}

module.exports = new Sync();