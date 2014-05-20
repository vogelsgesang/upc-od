"use strict";
var url = require("url");
var http = require("http");
var https = require("https");
var concat = require("concat-stream");

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

function requestSparqlData (queryUrl, successCallback, errorCallback) {
  //the callback which handles the answer from hardvard
  function harvardCallback(responseFromHarvard) {
  console.log(responseFromHarvard);
    if(responseFromHarvard.statusCode !== 200) {
      errorCallback(new Error("unexpected http status code: " + responseFromHarvard.statusCode));
    } else {
      responseFromHarvard.setEncoding("utf8");
      responseFromHarvard.pipe(concat({encoding: "string"}, function(responseBody) {
        var parsedData = JSON.parse(responseBody);
        var exposedData = restructureSparqlData(parsedData["docs"]);
        successCallback(exposedData);
      }));
    }
  }
  //send the query...
  var protocol = url.parse(queryUrl).protocol;
  if(protocol == "http:") {
    var req = http.request(queryUrl,harvardCallback);
  } else if(protocol == "https:") {
    var req = https.request(queryUrl,harvardCallback);
  } else {
    errorCallback(new Error("unexpected http status code " + responseFromHarvard.statusCode));
  }
  req.on("error", function(error) {
    errorCallback(new Error("request failed: " + error.message));
  });
  req.end();
  return req.abort.bind(req);
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
	console.log("jest!");
    if(objectType != "book") {
      errorCallback(new Error("unsupported object type: " + objectType));
      return function() {};
    } else {
      try {
	      var queryString = buildSparqlQuery(conditions, 0, config.limit);
      } catch(e) {
	      return errorCallback(e);
      }
      var queryUrl = config.sparqlEndpoint + "?" + queryString;
	    var abortFunction = requestSparqlData(queryUrl, successCallback, errorCallback);
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
