"use strict";
var url = require("url");
var http = require("http");
var https = require("https");
var concat = require("concat-stream");
var request = require('request');

//builds an query string in order to find the relevant records
//parameters:
// * type: the type (usually a URL)
// * conditionString: a string representing the additional conditions
//     might be created using buildConditionStringFromArray or buildConditionStringForId.
// * fields: which fields should be requested
// * limit: limits the maximal number of items returned by this source
function buildSparqlQuery(type, conditionString, fields, offset, limit) {
  var fieldString = "";
  fields.forEach(function(field, index) {
    fieldString += "OPTIONAL {?object <" + encodeURI(field) + "> " + "?f" + index + "}.\n";
  });
  var sparqlStr =
    "SELECT * WHERE {\n" +
    "?object a <" + encodeURI(type) + ">.\n" +
    conditionString +
    fieldString +
    "} LIMIT " + limit;
  console.log("SparQL query: \n" + sparqlStr);
  return sparqlStr;
}

//builds a SparQL fragment for a query by id
function buildConditionStringForId(id) {
  return "FILTER(?object = <" + encodeURI(id) +">.\n";
}

//builds a SparQL fragment which specifies the conditions
function buildConditionStringFromArray(conditions) {
  if(conditions.length == 0) {
    return "";
  } else {
    //go through all the subconditions (combined by an AND)
    var conditionString = "";
    conditions.forEach(function(condition) {
      var fieldName = "<" + encodeURI(condition[1][0]) + ">";
      //TODO: escape the values. Currently we are vulnerable to injection attacks
      var value = condition[2];
      if(condition[0] == "=") {
        var conditionStr = fieldName + " '" + value + "';\n";
        conditionString += conditionStr;
      } else {
        throw new Error("unsupported query condition");
      }
    });
    return "?object " + conditionString + ".\n";
  }
}

function requestSparqlData(endpoint, queryStr, type, fields, successCallback, errorCallback) {
  var options = {
   url: endpoint,
   form: { query: queryStr },
   headers: {
     Accept:	"application/sparql-results+json"
   }
  };
  var req=request.post(
    options,
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var parsedData = JSON.parse(body);
        var results = parsedData.results.bindings;
        var exposedData = restructureSparqlData(results, type, fields);

        console.log(require('util').inspect(exposedData, false, null));
        
        successCallback(exposedData);
      } else if(error) {
        errorCallback(new Error("request failed (" + endpoint + "): " + error.message));
      } else {
        errorCallback(new Error("request failed (" + endpoint + "): status code from SPARQL endpoint: " + response.statusCode));
      }
    }
  );
  return req;
}

//restructures the records in a way in which we can expose them to the integration layer
function restructureSparqlData(results, type, fieldNames) {
  return results.map(function(binding) {
    var fields = {};
    console.log(binding);
    fieldNames.forEach(function(fieldName, index) {
      if(binding["f"+index]) {
        fields[fieldName] = binding["f"+index].value;
      }
    });
    return {
      "id": binding.object.value,
      "type": type,
      "fields": fields
    }
  });
}

//the object which is actually exported...
module.exports = function SparqlAdapter(config) {
 //copy the config to own variable (keep in mind that JS is reference based)
 config = {
   sparqlEndpoint: config.sparqlEndpoint,
   limit: config.limit
 };
 //check the configuration: limit, sparqlEndpoint
 if(!("sparqlEndpoint" in config)) {
   throw new Error("config property \"sparqlEndpoint\" is missing");
 }
 if(typeof config.sparqlEndpoint != "string" || !/^https?:\/\//.test(config.sparqlEndpoint)) {
   throw new Error("sparqlEndpoint is not a valid endpoint URL");
 }
 if(!("limit" in config)) {
   throw new Error("config property \"limit\" is missing");
 }
 //this function can be used in order to query for data
 function query(objectType, conditions, fields, successCallback, errorCallback) {
   try {
     var conditionString = buildConditionStringFromArray(conditions);
     var queryStr = buildSparqlQuery(objectType, conditionString, fields, 0, config.limit);
   } catch(e) {
     return errorCallback(e);
   }
   var abortFunction = requestSparqlData(config.sparqlEndpoint, queryStr, objectType, fields, successCallback, errorCallback);
   return abortFunction;
 }
 //this = {}
 this.query = query;
 //this = {query: [Function]}

 //resolves an id
 function resolveId(objectType, id, fields, successCallback, errorCallback) {
   try {
     var conditionString = buildConditionStringForId(id);
     var queryStr = buildSparqlQuery(objectType, conditionString, fields, 0, config.limit);
   } catch(e) {
     return errorCallback(e);
   }
   var abortFunction = requestSparqlData(config.sparqlEndpoint, queryStr, objectType, fields, successCallback, errorCallback);
   return abortFunction;
 };
 this.resolveId = resolveId;
 //this = {query: [Function], resolveId: [Function]}
 //there are no cleanup procedures necessary for this adapter
 this.destroy = function() {};
 //this = {query: [Function], resolveId: [Function], destroy: [Function]}
}
