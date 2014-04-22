"use strict";

var express = require("express");
var nodeStatic = require("node-static");
var mongoose = require('mongoose');

//the code responsible for serving the client
var staticFiles = new(nodeStatic.Server)(__dirname + "/static", {gzip: true});

function serveStatic(request, response, next) {
  staticFiles.serve(request, response, function (err, result) {
    if (err) { next(err); }
  });
}
function serveMain(request, response, next) {
  staticFiles.serveFile("/main.html", 200, {}, request, response, function (err, result) {
    if (err) { next(err); }
  });
}


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
//start the server, as soon as the connection to the database exists
db.once('open', function callback () {
  console.log("Connected to Mongo");
  console.log("Starting server");
  //create the API router
  var api = express()
    .use(require('compression')())
    .use(require("./api/data-api"))
    .use(require("./api/meta-data"))
    .use('/experiments', require("./api/experiments"))
    .use(function(req, res, next) {
      var err = new Error("Invalid api endpoint");
      err.statusCode = 400;
      next(err);
    })
    .use(require('./api/error-handler.js'));
  //create the main entry point of the app
  var app = express()
    .use(express.logger('dev'))
    .use('/api', api)
    .get(/^\/(style.css$|js\/|partials\/|fonts\/)/, serveStatic)
    .get('*', serveMain)
    .use(function(err, req, res, next) {
      console.log(err);
      next(err);
    })
    .use(function(err, req, res, next) {
      if(err.status !== undefined) {
        res.statusCode = err.status;
      } else {
        res.statusCode = 500;
      }
      if(err.message !== undefined) {
        res.write(err.message);
      } else {
        res.write("Unknown Error");
      }
      res.end();
    });
  //start the server
  var server = app.listen(4443, function() {
    console.log("Server is listening on port " + server.address().port);
  });
});
//connect to the database
console.log("Connecting to Mongo");
mongoose.connect('mongodb://localhost/upc-od');
