var http = require("http");
var static = require('node-static');

var staticFiles = new(static.Server)('./static');

var port = 4443;

http.createServer(function(request, response) {
    request.addListener('end', function () {
        // Serve files!
        staticFiles.serve(request, response, function (err, result) {
             if (err) {
                 console.error("Error serving " + request.url + " - " + err.message);
                 response.writeHead(err.status, err.headers);
                 response.end();
             }
         });
    }).resume();
}).listen(port);
