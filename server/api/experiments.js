"use strict";
var express = require("express");
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

module.exports = express()
  .get("/data/:id", function(request, response) {
    response.json({id: request.params.id, data: "Not implemented so far"});
  })
  .get("/keyword/:kw", harvardKeywordSearch)
  .get("/team", function(req, res) {
    res.json(team);
    res.end();
  })
