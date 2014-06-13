"use strict";
var url = require("url");
var http = require("http");
var https = require("https");
var concat = require("concat-stream");
var request = require('request');

//builds an query string in order to find the relevant records
function buildSparqlQuery(type, conditions, fields, offset, limit) {
 var filterString = "";
 //go through all the subconditions (combined by an AND)
 //TODO: escape the values. Currently we are vulnerable to injection attacks
 conditions.forEach(function(condition) {
   var fieldName = "<" + encodeURI(condition[1][0]) + ">";
   var value = condition[2];
   if(condition[0] == "=") {
       var filter = fieldName+" '"+value+"';\n";
       filterString = filterString + filter;
   } else {
       throw new Error("unsupported query condition");
   }
 });  
 var fieldString = "";
 fields.forEach(function(field, index) {
    fieldString += "<" + encodeURI(field) + "> " + "?f" + index + ";\n";
 });
 var sparqlStr =
  "SELECT * WHERE {\n" +
  "?object a <" + encodeURI(type) + ">;" +
  filterString +
  fieldString +
  "} LIMIT " + limit;
 console.log("SparQL query: \n" + sparqlStr);
 return sparqlStr;
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
    fieldNames.forEach(function(fieldName, index) {
      fields[fieldName] = binding["f"+index].value;
    });
    return {
      //"id": binding["isbn"].value,
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
     var queryStr = buildSparqlQuery(objectType, conditions, fields, 0, config.limit);
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
   return query(objectType, [[["=", "id", id]]], fields, successCallback, errorCallback);
 };
 this.resolveId = resolveId;
 //this = {query: [Function], resolveId: [Function]}
 //there are no cleanup procedures necessary for this adapter
 this.destroy = function() {};
 //this = {query: [Function], resolveId: [Function], destroy: [Function]}
}
