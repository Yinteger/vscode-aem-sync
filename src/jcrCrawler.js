const http = require('http');

//Crawls the JCR to return info about specific nodes
class JCRCrawler {
    //Returns a tree of nodes starting from the given path
    getTree (path, host, port, username, password) {
        return new Promise((resolve, reject) => {
            console.log(path);
            const req = http.request({
                host,
                port,
                path: path + ".02.json",
                method: "GET",
                auth: username + ":" + password
            }, (resp) => {
                let responseBody = "";
                resp.setEncoding('utf8');
                resp.on('data', (chunk) => {
                    console.log(chunk);
                    responseBody += chunk;
                });

                resp.on('end', () => {
                    resolve(JSON.parse(responseBody));
                });
            });
            req.on('error', (err) => {
                reject(err);
            });
            req.end();
        });
    }
    //Get the contents of a file in JCR
    getFile(path) {

    }
}

module.exports = new JCRCrawler();