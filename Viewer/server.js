const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
// const host = "0.0.0.0";
const host = "localhost";
const port = 8000;
http.createServer((request, response) => {

    if (request.method === "POST" && request.url === "/save") {
        let body = [];
        request.on("data", (chunk) => {
            body.push(chunk);
        }).on("end", () => {
            body_dict = JSON.parse(Buffer.concat(body).toString());
            filepath = body_dict['filepath'];
            data = body_dict['data'];
            fs.writeFileSync(filepath, data);
            response.writeHead(200);
            response.end();
        });
        return;
    }

    if (request.method === "POST" && request.url === "/delete") {
        let body = [];
        request.on("data", (chunk) => {
            body.push(chunk);
        }).on("end", () => {
            body_dict = JSON.parse(Buffer.concat(body).toString());
            filepath = body_dict['filepath'];
            fs.rmSync(filepath);
            response.writeHead(200);
            response.end();
        });
        return;
    }

    if (request.method === "POST" && request.url === "/getMapList") {
        response.writeHead(200);
        let files_dict = {};
        let folders = fs.readdirSync("maps");
        folders.forEach(folder => {
            files_dict[folder] = [];
            let files = fs.readdirSync("maps/"+folder);
            files.sort();
            files.reverse();
            files.forEach(file => {
                files_dict[folder].push(file);
            });
        });
        response.write(JSON.stringify(files_dict));
        response.end();
        return;
    }

    var uri = url.parse(request.url).pathname;
    if (uri === "/" || uri === "") uri = "index.html";
    var filename = path.join(process.cwd(), uri);
    fs.readFile(filename, "binary", function(err, file) {
        if(err) {        
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(err + "\n");
            response.end();
            return;
        }
        response.writeHead(200);
        response.write(file, "binary");
        response.end();
    });

}).listen(port,host);
console.log('serving at '+host+':'+port.toString())