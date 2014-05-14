var express = require("express");
var bodyParser = require('body-parser');

module.exports = function(integrationService) {
  //expose the integration service
  var dataApi = express()
    .use(bodyParser.json())
    .post('/data/raw/:sourceId/query', function(req, res, next) {
      if(!req.body) {
        var err = new Error("Invalid request body");
        err.statusCode = 422;
        return next(err);
      }
      var sourceId = req.params.sourceId;
      var conditions = req.body.conditions;
      var fields = req.body.fields;
      var type = req.body.objectType;
      var resultsPromise = integrationService.querySource(sourceId, type, conditions, fields)
        .then(function(results) {res.json(results);})
        .catch(function(e) {next(e)});
      req.on('close', function() {
        resultsPromise.cancel();
      });
    })
    .post('/data/raw/:id/resolveLink', function(req, res, next) {
      next(new Error("Not implemented"));
    })
    .post('/data/composed/resolveLink', function(req, res, next) {
      next(new Error("Not implemented"));
    })
    .post('/data/composed/query', function(req, res, next) {
      next(new Error("Not implemented"));
    });
  return dataApi;
};
