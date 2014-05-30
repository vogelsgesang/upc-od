"use strict";
var url = require("url");
var http = require("http");
var https = require("https");
var concat = require("concat-stream");
var request = require('request');



function requestSparqlData (endpoint, queryStr, successCallback, errorCallback) {
	var sparqlStr =
		"PREFIX bibo: <http://purl.org/ontology/bibo/>\r\n" +
		"PREFIX blt: <http://www.bl.uk/schemas/bibliographic/blterms#>\r\n"+
		"PREFIX dct: <http://purl.org/dc/terms/>\r\n"+
		"SELECT ?book ?bnb ?title WHERE {\r\n" +
		"?book bibo:isbn13 '9780729408745';\r\n" +
		"blt:bnb ?bnb;\r\n" +
		"dct:title ?title.\r\n" +
		"}";
	var options = {
			  url: endpoint,
			  //proxy:'http://squid.srv.dhw.de:3128',
			  form: { query: sparqlStr },
			  headers: {
			    Accept:	"application/sparql-results+json"
			  }
			};
	var req=request.post(
		    options,
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		        	 var parsedData = JSON.parse(body);
//		        	 var exposedData = restructureSparqlData(parsedData["book"]);
		        	 console.log(body);
//		        	 successCallback(body);
		        	 errorCallback(new Error(JSON.stringify(parsedData.results.bindings)));
		        	 
		        }else{
		        	errorCallback(new Error("request failed: " + error.message));
					console.log(error);
				}
		    }
		);
	return req;
}

//restructures the records in a way in which we can expose them to the integration layer
function restructureSparqlData(foundBooks) {
  return foundBooks.map(function(book) {
    return {
      "id": book["id"],
      "type": "book",
      "fields": book
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
    if(objectType != "book") {
      errorCallback(new Error("unsupported object type: " + objectType));
      return function() {};
    } else {
//      try {
//	      var queryStr = buildSparqlQuery(conditions, 0, config.limit);
//      } catch(e) {
//	      return errorCallback(e);
//      }
//      var queryUrl = config.sparqlEndpoint + "?" + queryString;
	    var abortFunction = requestSparqlData(config.sparqlEndpoint, "", successCallback, errorCallback);
      return abortFunction;
    }
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
  //there are no cleanup procedures involved for this adapter
  this.destroy = function() {};
  //this = {query: [Function], resolveId: [Function], destroy: [Function]}
}

//var adapter = new HarvardAdapter(config);
//adapater = {query: [Function], resolveId: [Function]}
//adapter.query();
