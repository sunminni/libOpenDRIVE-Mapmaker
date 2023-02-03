const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");

http.createServer((request, response) => {
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

    if (request.method === "POST" && request.url === "/save") {
        let body = [];
        request.on("data", (chunk) => {
            body.push(chunk);
        }).on("end", () => {
            body_dict = JSON.parse(Buffer.concat(body).toString());
            filename = body_dict['filename'];
            data = body_dict['data'];
            fs.writeFileSync(filename, data);
            response.writeHead(200);
            response.end();
        });
    }
}).listen(8000);