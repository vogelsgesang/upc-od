"use strict";
var Router = require("./router");

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
  response.writeHead(200, {});
  response.write("Schema data...");
  response.end();
})
.addRoute("/data/:id", function(request, response, opts) {
  response.writeHead(200, {});
  response.write("{id: " + opts.params.id + ", data: \"Not implemented so far\"}");
  response.end();
});

module.exports = apiRoot;
