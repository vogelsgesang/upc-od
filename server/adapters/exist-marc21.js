"use strict";
var util = require("util");
var http = require("http");
var concat = require("concat-stream");
var et = require("elementtree");

var apiEndpoint = "http://localhost:8080/exist/rest//db/od/marc21_search.xq";

var url =  apiEndpoint + "?limit=2";

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

//the callback which handles the answer from eXistDb
function eXistCallback(xmlResults) {
  if(xmlResults.statusCode != 200) {
    console.error("unexpected status code " + xmlResults.statusCode);
  } else {
    xmlResults.setEncoding("utf8");
    xmlResults.pipe(concat({encoding: "string"}, function(xmlString) {
      var parsedCollection = parseMarc21XmlIntoObject(xmlString);
      var data = parsedCollection.map(function(record) {
        return {
          _id: record["001"],
          fields: record
        }
      });
      console.log(data);
    }));
  }
}

//request the data from eXistDb
var req = http.request(url, eXistCallback);
req.on("error", function(e) {
  console.error("error: " + e.message);
});
req.end();
