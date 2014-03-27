"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");
var http = require("http");

var schema = {
  "test1": "a",
  "test2": 2
}
schema.test3 = "b";
schema.teamMember = [
  {
    firstName: "Maryam",
    surname: "Pashmi"
  },
  {
    firstName: "Adrian",
    surname: "Vogelsgesang"
  },
  {
    firstName: "Franz"
  }
]

function handleUnknownRoute(request, response) {
  //Since we do not have an api so far, just answer with an error
  response.writeHead(404, {});
  response.write("Not implemented.");
  response.end();
}

var apiRoot = Router({unknownRoute: handleUnknownRoute})
  .addRoute("/schema", function(request, response, opts) {
    sendJson(request, response, schema);
  })
  .addRoute("/data/:id", function(request, response, opts) {
    sendJson(request, response, {id: opts.params.id, data: "Not implemented so far"});
  })
  .addRoute("/keyword/:kw", function(req, res, opts) {
    var options = "http://librarycloud.harvard.edu/v1/api/item?filter=keyword:" + opts.params.kw;
    
    res.writeHead(200, {"Content-Type": "application/json"});
   
    function callback(contents) {
      contents.on('data', function (chunk) {
        res.write(chunk);
      });
      contents.on("end", function(chunk) {
        res.end();
      });
    }

    var req = http.request(options, callback);
    req.on("error", function() {
      console.log("error");
    });
    req.end();
  });

var testRouter = Router()
  .addRoute("/adrian", function(req, res, opts) {
    res.write("Adrian");
    res.end();
  })
  .addRoute("/splats/*/*/*", function(req, res, opts) {
    sendJson(req, res, {splats: opts.splats});
  });

apiRoot.addChildRouter("/test/", testRouter);

module.exports = apiRoot;
