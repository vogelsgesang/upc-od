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
      
     // parsedResponse["docs"][0]["title"]
      /*for(var i = 0; i < foundBooks.length; i++) {
        console.log("Result " + i);
        console.log("  Title: " + foundBooks[i]['title']);
        console.log("  Publisher: " + foundBooks[i]['publisher']);
        console.log("  Creator: " + foundBooks[i]['creator']);
	console.log("  ISBN: " + foundBooks[i]['id_isbn']);
        console.log("  icsh: " + foundBooks[i]['lsch']);
	console.log("  language: " + foundBooks[i]['language']);
	console.log("  Year: " + foundBooks[i]['pub_date']);
      }*/
};
  

 //builds an Xquery string in order to find the relevant records
function buildHardvardQueries(conditions, offset, limit) {
  var searchword = ["keyword", "id", "title", "title_keyword", "creator", "creator_keyword", "note","note_keyword","lcsh","lcsh_keyword","publisher","pub_date","pub_location","format","Language","pages","height","id_inst","id_inst","id_isbn","id_lccn","call_num","url","holding_libs"];
    
  //handle empty condition arguments
  if(conditions.length === 0) {
    conditions = [[]];
  }
  var allQueries = [];
  //go through all the conditions (combined by an OR)
  conditions.forEach(function(andConditions){
    var filterStrings = [];
    //go through all the subconditions (combined by an AND)
    andConditions.forEach(function(condition) {
      var fieldName = condition[1];
      var value = condition[2];
      if(condition[0] == "=") {
	
	//filter=keyword:internet
	
        if(searchword.indexOf(fieldName)!=-1) {
          var filter = "filter="+encodeURIComponent(fieldName+":"+value);
	  filterStrings.push(filter);
        } else {
          throw new Error("not supported...");
	}
      }
    });  
    var parameters = filterStrings.concat("start=" + offset, "limit=" + limit);
    allQueries.push(parameters.join("&"));
  });
  return allQueries;
}

function requestHardvardData (queryUrl, successCallback, errorCallback) {
  //the callback which handles the answer from hardvard
  function harvardCallback(responseFromHarvard) {
    if(responseFromHarvard.statusCode !== 200) {
      errorCallback(new Error("unexpected http status code: " + responseFromHarvard.statusCode));
    } else {
      responseFromHarvard.setEncoding("utf8");
      responseFromHarvard.pipe(concat({encoding: "string"}, function(responseBody) {
	var parsedData = JSON.parse(responseBody);
	var exposedData = restructureHardvardData(parsedData["docs"]);
        successCallback(exposedData);
        //var parsedCollection = parseHardvardIntoObject(responseBody);
        //successCallback(parsedCollection);
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


//the object which is actually exported...
module.exports = function HardvardAdapter(config) {
  //this function can be used in order to query for data
  function query(objectType, conditions, fields, successCallback, errorCallback) {
    if(objectType != "book") {
      errorCallback(new Error("unsupported object type: " + objectType));
      return function() {};
    } else {
      try {
	var allQueryStrings = buildHardvardQueries(conditions, 0, config.limit);
      } catch(e) {
	return errorCallback(e);
      }
      var allResponses = [];
      var abortFunctions = [];
      //abortFunctions = [function for aborting 1st request , function abort 2nd req, ....]
      var errorCallbackAlreadyCalled = false;
      allQueryStrings.forEach(function(queryString) {
	var queryUrl = config.harvardEndpoint + "?" + queryString;
	abortFunctions.push(requestHardvardData(queryUrl, function(dataFromOneQuery) {
	  allResponses.push(dataFromOneQuery);
	  if(allResponses.length == allQueryStrings.length) {
	 //   combine all response into one final response
	    var exposedData = [];
	    for (var i = 0; i < allResponses.length; i++) {
	       exposedData = exposedData.concat(allResponses[i]);
	    }
	    var exposedData = {
	      "status": "finished",
	      "data": exposedData
	    }
	    successCallback(exposedData);
	  }
	}, function(error){
	  if(!errorCallbackAlreadyCalled) {
	    for(var i = 0; i < abortFunctions.length; i++) {
	      abortFunctions[i]();
	    }
	    errorCallbackAlreadyCalled = true;
	    errorCallback(error);
	  }
	}));
      });
     }
     return function() {
       for(var i = 0; i < abortFunctions.length; i++) {
	 abortFunctions[i]();
       }
     }
  }
  //this = {}
  this.query = query;
  //this = {query: [Function]}

  //resolves an id
  function resolveId(id, fields, successCallback, errorCallback) {
    return query("book", [[["=", "id", id]]], fields, successCallback, errorCallback);
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

//restructures the records in a way in which we can expose them to the integration layer
function restructureHardvardData(foundBooks) {
  return foundBooks.map(function(book) {
    return {
      "id": book["id"],
      "type": "book",
      "fields": book
    }
  });
}
