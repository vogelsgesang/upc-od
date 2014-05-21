"use strict";
var url = require("url");
var http = require("http");
var https = require("https");
var concat = require("concat-stream");
var request = require('request');
//parses a collection of Hardvard into objects
function parseHardvardIntoObject(jsonString) {
     var parsedResponse = JSON.parse(jsonString);
     var foundBooks = parsedResponse['docs'];
     return foundBooks;
};
 

//builds an query string in order to find the relevant records
function buildSparqlQuery(conditions, offset, limit) {
 var searchword = ["keyword", "id", "title", "title_keyword", "creator", "creator_keyword", "note","note_keyword","lcsh","lcsh_keyword","publisher","pub_date","pub_location","format","language","pages","height","id_inst","id_inst","id_isbn","id_lccn","call_num","url","holding_libs"];
 //handle empty condition arguments
 if(conditions.length === 0) {
   conditions = [];
 }
 var filterStrings = [];
 //go through all the subconditions (combined by an AND)
 conditions.forEach(function(condition) {
   var fieldName = condition[1][0];
   var value = condition[2];
   if(condition[0] == "=") {
     if(searchword.indexOf(fieldName)!=-1) {
       var filter = "filter="+encodeURIComponent(fieldName+":"+value);
       filterStrings.push(filter);
     } else {
       throw new Error("unsupported query condition");
     }
   }
 });  
 var parameters = filterStrings.concat("start=" + offset, "limit=" + limit);
 var queryString = parameters.join("&");
 return queryString;
}

function requestSparqlData (endpoint, queryStr, successCallback, errorCallback) {
var sparqlStr =
"PREFIX bibo: <http://purl.org/ontology/bibo/>\r\n" +
"PREFIX blt: <http://www.bl.uk/schemas/bibliographic/blterms#>\r\n"+
"PREFIX dct: <http://purl.org/dc/terms/>\r\n"+
"SELECT * WHERE {\r\n" +
"?book bibo:isbn13 '9780729408745';\r\n" +
"blt:bnb ?bnb;\r\n" +
"dct:title ?title;\r\n" +
"bibo:isbn13 ?isbn;\r\n" +
"}";
var options = {
 url: endpoint,
 proxy:'http://squid.srv.dhw.de:3128',
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
       	 var results = parsedData.results.bindings;
       	 var exposedData = restructureSparqlData(results);
       	 console.log(body);
//	        	 successCallback(exposedData);
       	 errorCallback(new Error(JSON.stringify(exposedData)));
       	
       }else{
       	errorCallback(new Error("request failed: " + error.message));
console.log(error);
}
   }
);

return req;
}

//restructures the records in a way in which we can expose them to the integration layer
function restructureSparqlData(results) {
 return results.map(function(book) {
   return {
     "id": book["bnb"].value,
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
