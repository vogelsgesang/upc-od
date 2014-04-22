"use strict";
var express = require("express");
var baucis = require("baucis");
var delayResponse = require("./delay-response");

function handleApiError(err, req, res, next) {
  if(!err) return next();
  var statusCode = res.statusCode;
  if(statusCode == 200) {
    statusCode = 500;
  }
  if(err.status!== undefined) {
    statusCode = err.status;
  }
  if(err.statusCode !== undefined) {
    statusCode = err.statusCode;
  }
  var message = "An error occured";
  if(err.message !== undefined) {
    message = err.message;
  }
  res.statusCode = statusCode;
  res.json({
    msg: message
  });
}

//load the necessary models
require("../model/source");
require("../model/schema");
baucis.rest('Source');
baucis.rest('ObjectDefinition');

var apiRoot = express()
  .use(require('compression')())
  .use(delayResponse(800))
  .use(baucis())
  .use(require("./data-api"))
  .use("/experiments", require("./experiments"))
  .use(function(req, res, next) {
    var err = new Error("Invalid api endpoint");
    err.statusCode = 400;
    next(err);
  })
  .use(handleApiError);

module.exports = apiRoot;
