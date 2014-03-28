"use strict";
var Router = require("./router");
var connect = require("connect");
var sendJson = require("send-data/json");

function handleApiError(err, req, res, next) {
  if(err.code == 404) {
    sendJson(req, res, {
      statusCode: 404,
      body: {"status":"error", msg: "Unknown api endpoint"}
    });
  } else if(err.code == 405) {
    sendJson(req, res, {
      statusCode: 405,
      headers: {Accept: err.acceptedMethods.join(", ")},
      body: {"status":"error", msg: "Method not supported"}
    });
  } else {
    var jsonResponse = {"status":"error"};
    if(err.message !== undefined) {
      jsonResponse.message = err.message;
    }
    if(err.stack !== undefined) {
      jsonResponse.stack = err.stack;
    }
    sendJson(req, res, {
      statusCode: 500,
      body: jsonResponse
    });
  }
}

var apiRoot = connect()
  .use(Router()
    .addChildRouter("/schema", require("./schema"))
    .addChildRouter("/experiments", require("./experiments"))
  ).use(handleApiError);

module.exports = apiRoot;
