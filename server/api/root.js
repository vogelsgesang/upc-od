"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");
var http = require("http");

function handleUnknownRoute(req, res) {
  sendJson(req, res, {
    statusCode: 404,
    body: {type:"error", msg: "Unknown api endpoint"}
  })
}

var apiRoot = Router({unknownRoute: handleUnknownRoute})
  .addChildRouter("/schema", require("./schema"))
  .addRoute("/data/:id", function(request, response) {
    sendJson(request, response, {id: request.params.id, data: "Not implemented so far"});
  })
  .addRoute("/keyword/:kw", function(req, res) {
    var options = "http://librarycloud.harvard.edu/v1/api/item?filter=keyword:" + req.params.kw;
    
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

var testRouter = Router({unknownRoute: handleUnknownRoute})
  .addRoute("/adrian", function(req, res) {
    sendJson(req, res, {firstname: "Adrian", surname:"Vogelsgesang"});
    res.end();
  })
  .addRoute("/splats/*/*?", function(req, res) {
    sendJson(req, res, {splats: res.splats});
  });

apiRoot.addChildRouter("/test/", testRouter);

module.exports = apiRoot;
