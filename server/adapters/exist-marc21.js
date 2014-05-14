"use strict";
var url = require("url");
var http = require("http");
var https = require("https");
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

//restructures the records in a way in which we can expose them to the integration layer
function restructureMarcRecords(records) {
  return records.map(function(record) {
    return {
      id: record["001"],
      type: "marcRecord",
      fields: record
    }
  });
}

//builds an Xquery string in order to find the relevant records
function buildMarc21Xquery(conditions, offset, limit) {
  //handle empty condition arguments
  if(conditions.length === 0) {
    conditions = [];
  }
  //go through all the conditions (combined by an OR)
  var conditionString = "";
  //go through all the subconditions (combined by an AND)
  conditions.forEach(function(condition) {
    var operator = condition[0];
    var fieldPath = condition[1];
    var escapedValue = condition[2]
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
    if(operator == "=") {
      if(fieldPath.length == 1 && /^00[1-8]$/.test(fieldPath[0])) {
        conditionString += "[controlfield[@tag='"+fieldPath[0]+"'] = '"+escapedValue+"']";
      } else if(fieldPath.length == 2 && /^[0-9]{3}$/.test(fieldPath[0]) && /^[0-9a-z]$/.test(fieldPath[1])) {
        var tag = fieldPath[0];
        var code = fieldPath[1];
        conditionString += "[datafield[@tag='"+tag+"']/"+
            "subfield[@code='"+code+"'] = '"+escapedValue+"']";
      } else {
        throw new Error("unknown field: " + fieldPath);
      }
    } else {
      throw new Error("unknown operator: " + operator);
    }
  });
  var selectionPath = "/collection/record"+conditionString;
  var selectionXquery = "subsequence(" + selectionPath +","+offset+","+(limit+1)+")";
  var namespaceDefinition = "declare default element namespace 'http://www.loc.gov/MARC21/slim';";
  return namespaceDefinition + "\n" + selectionXquery;
}

//this function sends the query to the eXistDb server and
//parses the results...
function requestMarc21Records(queryUrl, successCallback, errorCallback) {
  //the callback which handles the answer from eXistDb
  function eXistCallback(xmlResults) {
    if(xmlResults.statusCode != 200) {
      errorCallback(new Error("unexpected http status code " + xmlResults.statusCode));
    } else {
      xmlResults.setEncoding("utf8");
      xmlResults.pipe(concat({encoding: "string"}, function(xmlString) {
        var parsedCollection = parseMarc21XmlIntoObject(xmlString);
        successCallback(parsedCollection);
      }));
    }
  }
  //send the query...
  var protocol = url.parse(queryUrl).protocol;
  if(protocol == "http:") {
    var req = http.request(queryUrl, eXistCallback);
  } else if(protocol == "https:") {
    var req = https.request(queryUrl, eXistCallback);
  } else {
    return errorCallback(new Error("unknown protocol: " +  protocol));
  }
  req.on("error", function(e) {
    errorCallback(new Error("request failed: " + e.message));
  });
  req.end();
  return req.abort.bind(req);
}

//the object which is actually exported...
module.exports = function ExistMarc21Adapter(config) {
  //copy the config to own variable (keep in mind that JS is reference based)
  config = {
    eXistEndpoint: config.eXistEndpoint,
    xmlDocumentPath: config.xmlDocumentPath,
    limit: config.limit
  };
  //check, if the configuration is valid
  if(!("eXistEndpoint" in config)) {
    throw new Error("config property \"eXistEndpoint\" is missing");
  }
  if(typeof config.eXistEndpoint != "string" || !/^https?:\/\//.test(config.eXistEndpoint)) {
    throw new Error("eXistEndpoint is not a valid endpoint URL");
  }
  if(!("xmlDocumentPath" in config)) {
    throw new Error("config property \"xmlDocumentPath\" is missing");
  }
  if(typeof config.xmlDocumentPath != "string") {
    throw new Error("xmlDocumentPath is invalid");
  }
  if(!("limit" in config)) {
    throw new Error("config property \"limit\" is missing");
  }
  //this function can be used in order to query for data
  function query(objectType, conditions, fields, successCallback, errorCallback) {
    if(objectType != "marcRecord") {
      process.nextTick(function() {
        errorCallback(new Error("unsupported object type: " + objectType));
      });
      return function() {};
    } else {
      try {
        var xquery = buildMarc21Xquery(conditions, 0, config.limit);
      } catch(e) {
        errorCallback(e);
      }
      var queryUrl = config.eXistEndpoint + config.xmlDocumentPath + "?_query=" + encodeURIComponent(xquery);
      return requestMarc21Records(queryUrl, function(marcRecords) {
        var exposedData = restructureMarcRecords(marcRecords);
        successCallback(exposedData);
      }, errorCallback);
    }
  }
  this.query = query;

  //resolves an id
  function resolveId(objectType, id, fields, successCallback, errorCallback) {
    return query(objectType, [[["=", "001", id]]], fields, successCallback, errorCallback);
  };
  this.resolveId = resolveId;

  //there are no cleanup procedures involved for this adapter
  this.destroy = function() {};
}
