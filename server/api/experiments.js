"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");
var http = require("http");

function harvardKeywordSearch(req, res) {
  var options = "http://librarycloud.harvard.edu/v1/api/item?filter=keyword:" + req.params.kw;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");

  function callback(contents) {
    contents.on('data', function (chunk) {
      res.write(chunk);
    });
    contents.on('end', function(chunk) {
      res.end();
    });
  }

  var req = http.request(options, callback);
  req.on("error", function() {
    console.log("error");
  });
  req.end();
}

var team = [
  {firstname: "Maryam", surname: "Pashmi"},
  {firstname: "Franz", surname: "Berneo"},
  {firstname: "Adrian", surname: "Vogelsgesang"}
];

module.exports = Router()
  .addRoute("/data/:id", function(request, response) {
    sendJson(request, response, {id: request.params.id, data: "Not implemented so far"});
  })
  .addRoute("/keyword/:kw", harvardKeywordSearch)
  .addRoute("/team", function(req, res) {
    sendJson(req, res, team);
    res.end();
  })
  .addRoute("/echo/*?", function(req, res) {
    sendJson(req, res, {query: req.splats[0]});
  });
