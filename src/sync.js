//Sync a package to the AEM server
const PACKAGEMGR_PATH = "/crx/packmgr/service.jsp";
const fs = require('fs');
var rp = require('request-promise');
rp.debug = true;
const parseUrl = require('url').parse
const http = require('http');
const querystring = require('querystring');

class Sync {
    syncPackage(packagePath, host, port, username, password) {
        var url = parseUrl("http://" + username + ":" + password + "@" + host + ":" + port + PACKAGEMGR_PATH);
        var auth = Buffer.from(url.auth).toString('base64');
        var cleanURL = "http://" + url.host + url.path;
        console.log('Basic ' + auth);
        console.log(cleanURL);
        // return new Promise((resolve, reject) => {
        //     rp({uri: cleanURL, formData: {
        //         "file": fs.createReadStream(packagePath),
        //         "force": "true",
        //         "install": "true"
        //     }, method: "POST", headers: {'Authorization': 'Basic ' + auth}}).then((resp) => {
        //         console.log(resp);
        //     }).catch((err) => {
        //         console.error(err);
        //     })
        // });
        var body = "----------------------------553807080757934961515820\r\nContent-Disposition: form-data; name=\"install\"\r\n\r\ntrue\r\n----------------------------553807080757934961515820\r\nContent-Disposition: form-data; name=\"force\"\r\n\r\ntrue\r\n----------------------------553807080757934961515820\r\nContent-Disposition: form-data; name=\"file\"; filename=\"sync.zip\"\r\nContent-Type: application/zip\r\n\r\n";
        body = Buffer.from(body, 'utf-8');
        var fileString = "";
        var readStream = fs.createReadStream(packagePath);
        readStream.on('readable', (buffer) => {
            var chunk;
            while (null !== (chunk = readStream.read())) {
                fileString += chunk;
            }
        });
        readStream.on('end', () => {
            body+= Buffer.from(fileString, 'utf-8');
            body += Buffer.from("\r\n----------------------------553807080757934961515820--\r\n", "utf-8");
            //File Contents to body
            const options = {
                hostname: "localhost",
                port: 4502,
                path: PACKAGEMGR_PATH,
                method: "POST",
                auth: "admin:admin",
                headers: {
                    'content-type': 'multipart/form-data; boundary=--------------------------553807080757934961515820',
                    'content-length': Buffer.byteLength(body),
                    'connection': 'keep-alive',
                    'accept': '*/*'
                }
            };
    
            const req = http.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                  console.log(`BODY: ${chunk}`);
                });
                res.on('end', () => {
                  console.log('No more data in response.');
                });
            });
    
            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
            });
              
            // write data to request body
            req.write(body);
            req.end();
        });
    }
}

module.exports = new Sync();