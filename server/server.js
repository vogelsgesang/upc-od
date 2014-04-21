"use strict";

var express = require("express");
var nodeStatic = require("node-static");
var apiRoot = require("./api/root");

var staticFiles = new(nodeStatic.Server)(__dirname + "/static", {gzip: true});

function serveStatic(request, response, next) {
  staticFiles.serve(request, response, function (err, result) {
    if (err) {
      next(err);
    }
  });
}
function serveMain(request, response, next) {
  // Serve the main file
  staticFiles.serveFile("/main.html", 200, {}, request, response, function (err, result) {
    if (err) {
      next(err);
    }
  });
}

var app = express()
  .use(express.logger('dev'))
  .use('/api', apiRoot)
  .get(/^\/(style.css$|js\/|partials\/|fonts\/)/, serveStatic)
  .get('*', serveMain);

var server = app.listen(4443, function() {
  console.log("server is listening on port " + server.address().port);
});
