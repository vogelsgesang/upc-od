"use strict";
var express = require("express");
var bodyParser = require("body-parser");
var delayResponse = require("./delay-response");

function handleBodyError(err, req, res, next) {
  if(err instanceof SyntaxError) {
    res.json({
      statusCode: 400,
      body: {"status":"error", msg: "Unable to parse request body: " + err.message}
    });
  } else {
    next(err);
  }
}

function handleApiError(err, req, res, next) {
  var statusCode = 500;
  if(err.statusCode !== undefined) {
    statusCode = err.statusCode;
  }
  var jsonResponse = {};
  if(err.message !== undefined) {
    jsonResponse.message = err.message;
  }
  res.json({
    statusCode: statusCode,
    body: jsonResponse
  });
}

var apiRoot = express()
  .use(bodyParser.json())
  .use(handleBodyError)
  .use(delayResponse(800))
  .use("/schema", require("./schema"))
  .use("/sources", require("./sources"))
  .use("/experiments", require("./experiments"))
  .use(function(req, res, next) {
    var err = new Error("Invalid api endpoint");
    err.statusCode = 404;
    next(err);
  })
  .use(handleApiError);

module.exports = apiRoot;
