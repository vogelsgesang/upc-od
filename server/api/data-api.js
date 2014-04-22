var express = require("express");
var bodyParser = require('body-parser');

var dataApi = express()
  .use(bodyParser.json())
  .post('/data/rawquery', function(req, res) {
    res.json(req.body);
    res.end();
  });

module.exports = dataApi;
