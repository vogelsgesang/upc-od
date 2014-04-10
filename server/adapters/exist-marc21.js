"use strict";
var util = require("util");
var http = require("http");
var concat = require("concat-stream");
var et = require("elementtree");

//parses a collection of Marc21 records into objects
function parseMarc21XmlIntoObject(xmlString) {
  var resultRecords = [];
  var xmlTree = et.parse(xmlString);
  //handle all records
  xmlTree.findall("./record").forEach(function(record) {
    var currentResultRecord = {};
    //retrieve the values out of the controlfield elements
    record.findall("./controlfield").forEach(function(field) {
      var tag = field.get("tag");
      currentResultRecord[tag] = field.text;
    });
    //retrieve the values out of the datafield elements
    record.findall("./datafield").forEach(function(field) {
      var tag = field.get("tag");
      var datafieldContents = {};
      field.findall("./subfield").forEach(function(subfield) {
        var code = subfield.get("code");
        datafieldContents[code] = subfield.text;
      });
      if(!(tag in currentResultRecord)) {
        currentResultRecord[tag] = [];
      }
      currentResultRecord[tag].push(datafieldContents);
    });
    resultRecords.push(currentResultRecord);
  });
  return resultRecords;
}

//builds an Xquery string in order to find the relevant records
function buildMarc21Xquery(conditions, offset, limit) {
  var selectionPaths = []; //set of Xpaths for retrieving the correct records
  //handle empty condition arguments
  if(conditions.length === 0) {
    conditions = [[]];
  }
  //go through all the conditions (combined by an OR)
  conditions.forEach(function(andConditions){
    var conditionString = "";
    //go through all the subconditions (combined by an AND)
    andConditions.forEach(function(condition) {
      var fieldName = condition[1];
      var escapedValue = condition[2]
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/"/g, "&apos;");
      if(condition[0] == "=") {
        if(/^00[1-8]$/.test(fieldName)) {
          conditionString += "[controlfield[@tag='"+fieldName+"']/text() = '"+escapedValue+"']";
        } else if(/^[0-9]{3}[a-z0-9]$/.test(fieldName)) {
          var tag = fieldName.substr(0,3);
          var code = fieldName.substr(3,1);
          conditionString += "[datafield[@tag='"+tag+"']/"+
              "subfield[@code='"+code+"']/text() = '"+escapedValue+"']";
        } else {
          console.error("not supported...");
        }
      } else {
        console.error("not supported...");
      }
    });
    selectionPaths.push("/collection/record"+conditionString);
  });
  var selectionPath = "(\n   " + selectionPaths.join("\n | ") + "\n)";
  var selectionXquery = "subsequence(" + selectionPath +","+offset+","+limit+")";
  var namespaceDefinition = "declare default element namespace 'http://www.loc.gov/MARC21/slim';";
  return namespaceDefinition + "\n" + selectionXquery;
}

var config = {
  eXistEndpoint : "http://localhost:8080/exist/rest/",
  xmlDocumentPath: "/db/od/books_export.xml",
  limit: 20
};

var condition = [
  [
    ["=", "003", "SzGeCERN"],
    ["=", "020a", "3540120351"]
  ]
];

var xquery = buildMarc21Xquery(condition, 0, config.limit);
console.log(xquery);

//the callback which handles the answer from eXistDb
function eXistCallback(xmlResults) {
  if(xmlResults.statusCode != 200) {
    console.log("unexpected http status code " + xmlResults.statusCode);
  } else {
    xmlResults.setEncoding("utf8");
    xmlResults.pipe(concat({encoding: "string"}, function(xmlString) {
      var parsedCollection = parseMarc21XmlIntoObject(xmlString);
      var data = parsedCollection.map(function(record) {
        return {
          id: record["001"],
          type: "marcRecord",
          fields: record
        }
      });
      console.log(data);
    }));
  }
}
//send the query...
var url = config.eXistEndpoint + config.xmlDocumentPath + "?_query=" + encodeURIComponent(xquery);
console.log(url);
var req = http.request(url, eXistCallback);
req.on("error", function(e) {
  errorCallback("requestFailed");
});
req.end();

/*
function resolveId(id, fields, successCallback, errorCallback) {
  return queryExistForMarc21(eXistEndpoint + queryString, successCallback, errorCallback);
};

function query(objectType, conditions, successCallback, errorCallback) {
  if(objectType != "marcRecord") {
    errorCallback("unsupported object type" + objectType);
    return function() {};
  } else {
    //TODO: build the query string
    var queryString = "TODO";
    return queryExistForMarc21(eXistEndpoint + queryString, successCallback, errorCallback);
  }
}
*/
