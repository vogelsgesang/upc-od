"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");

var schema = {
  "test": "a",
  "test2": 2
}
schema.test3 = "b";

function handleUnknownRoute(request, response) {
  //Since we do not have an api so far, just answer with an error
  response.writeHead(404, {});
  response.write("Not implemented.");
  response.end();
}
var apiRoot = Router({unknownRoute: handleUnknownRoute});

apiRoot
.addRoute("/schema", function(request, response, opts) {
  sendJson(request, response, schema);
})
.addRoute("/data/:id", function(request, response, opts) {
  sendJson(request, response, {id: opts.params.id, data: "Not implemented so far"});
});

module.exports = apiRoot;
