var express = require("express");
var bodyParser = require('body-parser');

//expose the integration service
var dataApi = express()
  .use(bodyParser.json())
  .post('/data/rawquery', function(req, res) {
    res.json(req.body);
    res.end();
  });

module.exports = dataApi;
