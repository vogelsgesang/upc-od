"use strict";
var port = 4443;

var http = require("http");
var connect = require("connect");
var url = require("url");
var nodeStatic = require("node-static");
var apiRoot = require("./api/root");

var staticFiles = new(nodeStatic.Server)(__dirname + "/static", {gzip: true});

function handleRequest(request, response) {
  var pathName = url.parse(request.url).pathname;
  var ressourceRegExp = /^\/(style.css$|js\/|partials\/|fonts\/)/;
  if(pathName.substring(0,5) == "/api/") {
    request.url = request.url.substring(4);
    //handle this api call
    apiRoot(request, response);
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

var app = connect()
  .use(connect.logger('dev'))
  .use(handleRequest);

http.createServer(app).listen(port);

console.log("server is listening on port " + port);
