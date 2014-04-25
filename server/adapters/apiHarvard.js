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
          console.error("not supported...");
	}
      }
    });  
    var combinedFilters = filterStrings.join("&");
    allQueries.push(combinedFilters);
  });
  return allQueries;
}

function requestHardvardData (queryUrl, successCallback, errorCallback) {
  //the callback which handles the answer from hardvard
  function harvardCallback(responseFromHarvard) {
   if(responseFromHarvard.statusCode !== 200) {
    console.log("unexpected http status code" + responseFromHarvard.statusCode);
  } else {
    responseFromHarvard.setEncoding("utf8");
    responseFromHarvard.pipe(concat({encoding: "string"}, function(responseFromHarvard) {
        var parsedCollection = parseHardvardIntoObject(responseFromHarvard);
        successCallback(parsedCollection);
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
  req.on("error", function(e) {
    throw new Error("request failed: " + protocol);
    errorCallback(new Error("request failed: " + e.message));
  });
  req.end();
  return req.abort;
}


//the object which is actually exported...
module.exports = function HardvardAdapter(config) {
  //this function can be used in order to query for data
  function query(objectType, conditions, fields, successCallback, errorCallback) {
    if(objectType != "book") {
      errorCallback(new Error("unsupported object type: " + objectType));
      return function() {};
    } else {
      var allQueryStrings = buildHardvardQueries(conditions, 0, config.limit);
      //console.log(allQueryStrings);
      allQueryStrings.forEach(function(queryString) {
	var queryUrl = config.harvardEndpoint + "?" + queryString;
	var req = http.request(queryUrl);
	console.log(queryUrl);
	
	
	
      });
      /*return requestHardvardData(queryUrl, function(marcRecords) {
        var exposedData = restructureMarcRecords(marcRecords);
        var results = {
          "status": "finished",
          "data": exposedData
        }
        successCallback(results);
      }, errorCallback);*/
      successCallback({});
    }
  }
  this.query = query;

  //resolves an id
  function resolveId(id, fields, successCallback, errorCallback) {
    return query("marcRecord", [[["=", "001", id]]], fields, successCallback, errorCallback);
  };
  this.resolveId = resolveId;

  //there are no cleanup procedures involved for this adapter
  this.destroy = function() {};
}
 

//restructures the records in a way in which we can expose them to the integration layer
function restructureMarcRecords(foundBooks) {
  return foundBooks.map(function(book) {
    return {
      "id": book["id"],
      "type": "book",
      "fields": book
    }
  });
}
