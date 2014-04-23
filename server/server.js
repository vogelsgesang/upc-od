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

//creates the express app, sets up all the routes etc.
function createExpressApp() {
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
  return app;
}

var Source = require("./model/source");
//initialize the middleware
//i.e.: load the configuration from the database and configure the middleware accordingly
//passes the initialized middleware to the callback as second argument.
//the first argument to the callback is an error object or null
function initializeMiddleware(callback) {
  Source.model.find({}, function(err, sources) {
    if(err) {return callback(err);}
    var Middleware = require("./integration-service");
    var middleware = new Middleware();
    try {
      sources.forEach(function(source) {
        middleware.configureSource(source);
      });
    } catch(e) {
      middleware.destroy();
      return callback(e);
    }
    callback(null, middleware);
  })
}
//registers the necessary event listeners
//in order to keep the middleware in sync with the meta data repository
function registerMongooseListenersForMiddleware(middleware) {
  Source.schema.pre('save', function(next) {
    try {
      console.log(this);
      middleware.configureSource(this);
    } catch(e) {
      return next(e);
    }
    next();
  });
  Source.schema.pre('remove', function(next) {
    try{
      middleware.removeSource(this._id);
    } catch(e) {
      return next(e);
    }
    next();
  });
}

//initialize mongoose
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
//start the server, as soon as the connection to the database exists
db.once('open', function callback () {
  console.log("Initializing middleware...");
  initializeMiddleware(function(err, middleware) {
    if(err) {
      console.log(err);
      return;
    }
    //wire up the middleware
    console.log("Connecting the middleware to the meta data repository...");
    registerMongooseListenersForMiddleware(middleware);
    //start the server
    console.log("Starting http server...");
    var app = createExpressApp();
    var server = app.listen(4443, function() {
      console.log("Server is listening on port " + server.address().port);
    });
  });
});
//connect to the database
console.log("Connecting to Mongo...");
mongoose.connect('mongodb://localhost/upc-od');
