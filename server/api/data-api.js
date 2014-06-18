var express = require("express");
var bodyParser = require('body-parser');

module.exports = function createDataApi(integrationService) {
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
    .post('/data/consolidated/resolveLink', function(req, res, next) {
      next(new Error("Not implemented"));
    })
    .post('/data/consolidated/query', function(req, res, next) {
      if(!req.body) {
        var err = new Error("Invalid request body");
        err.statusCode = 422;
        return next(err);
      }
      var conditions = req.body.conditions;
      var objectType = req.body.objectType;
      var consolidatedQuery = integrationService.createConsolidatedQuery();
      consolidatedQuery.addQuery(objectType, conditions);
      consolidatedQuery.on("done", function(results) {
        //errors can not be serialized by JSON.stringify. Hence, they
        //must be handled differently.
        var errors = [];
        results.errors.forEach(function(err) {
          errors.push("" + err);
        });
        res.json({errors: errors, data: results.data});
      });
      req.on('close', function() {
        consolidatedQuery.cancel();
      });
    });
  return dataApi;
};
