"use strict";
var port = 4443;

var http = require("http");
var url = require('url');
var nodeStatic = require('node-static');;

var staticFiles = new(nodeStatic.Server)('./static');

function handleRequest(request, response) {
  var pathName = url.parse(request.url).pathname;
  var apiRegExp = /^\/api\//;
  var ressourceRegExp = /^\/(style.css|js\/|partials\/)/;
  if(apiRegExp.test(pathName)) {
    //this is an api call.
    //Since we do not have an api so far, just answer with an error
    response.writeHead(404, {});
    response.write("Not implemented.");
    response.end();
  } else if(ressourceRegExp.test(pathName)) {
    // Serve ressource files
    staticFiles.serve(request, response, function (err, result) {
      if (err) {
        console.error("Error serving " + request.url + " - " + err.message);
        response.writeHead(err.status, err.headers);
        response.end();
      }
    });
  } else {
    // Serve the main file
    staticFiles.serveFile('/main.html', 200, {}, request, response, function (err, result) {
      if (err) {
        console.error("Error serving " + request.url + " - " + err.message);
        response.writeHead(err.status, err.headers);
        response.end();
      }
    });
  }
}

http.createServer(handleRequest).listen(port);

console.log("server is listening on port " + port);
