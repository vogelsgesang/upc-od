"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");

function handleUnknownRoute(req, res) {
  sendJson(req, res, {
    statusCode: 404,
    body: {type:"error", msg: "Unknown api endpoint"}
  })
}

var apiRoot = Router({unknownRoute: handleUnknownRoute})
  .addChildRouter("/schema", require("./schema"))
  .addChildRouter("/experiments", require("./experiments"));

module.exports = apiRoot;
