"use strict";
var Router = require("./router");
var connect = require("connect");
var sendJson = require("send-data/json");
var bodyParser = require("body-parser");

function handleBodyError(err, req, res, next) {
  if(err instanceof SyntaxError) {
    sendJson(req, res, {
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
  if(err.message !== undefined) {
    jsonResponse.message = err.message;
  }
  sendJson(req, res, {
    statusCode: statusCode,
    body: jsonResponse
  });
}

var apiRoot = connect()
  .use(bodyParser.json())
  .use(handleBodyError)
  .use(Router()
    .addChildRouter("/schema", require("./schema"))
    .addChildRouter("/sources", require("./sources"))
  ).use(handleApiError);

module.exports = apiRoot;
