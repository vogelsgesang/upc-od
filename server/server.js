"use strict";

var express = require("express");
var nodeStatic = require("node-static");
var mongoose = require('mongoose');

var staticFiles = new(nodeStatic.Server)(__dirname + "/static", {gzip: true});

function serveStatic(request, response, next) {
  staticFiles.serve(request, response, function (err, result) {
    if (err) { next(err); }
  });
}
function serveMain(request, response, next) {
  // Serve the main file
  staticFiles.serveFile("/main.html", 200, {}, request, response, function (err, result) {
    if (err) { next(err); }
  });
}

var app = express()
  .use(express.logger('dev'))
  .use('/api', require("./api/root"))
  .get(/^\/(style.css$|js\/|partials\/|fonts\/)/, serveStatic)
  .get('*', serveMain);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("Connected to Mongo");
  console.log("Starting server");
  var server = app.listen(4443, function() {
    console.log("Server is listening on port " + server.address().port);
  });
});
console.log("Connecting to Mongo");
mongoose.connect('mongodb://localhost/upc-od');
