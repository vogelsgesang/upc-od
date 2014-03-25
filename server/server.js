"use strict";
var port = 4443;

var http = require("http");
var url = require("url");
var nodeStatic = require("node-static");
var api = require("./api");

var staticFiles = new(nodeStatic.Server)("./static", {gzip: true});

function handleRequest(request, response) {
  var pathName = url.parse(request.url).pathname;
  var apiRegExp = /^\/api\//;
  var ressourceRegExp = /^\/(style.css$|js\/|partials\/|fonts\/)/;
  if(apiRegExp.test(pathName)) {
    //handle this api call
    api.handle(request, response);
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
    staticFiles.serveFile("/main.html", 200, {}, request, response, function (err, result) {
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
