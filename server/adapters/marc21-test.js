"use strict";
//this information will be stored in the MongoDB...
var adapterName = "exist-marc21";
var config = {
  eXistEndpoint : "http://localhost:8080/exist/rest/",
  xmlDocumentPath: "/db/od/books_export.xml",
  limit: 20
};

//create the adapter instance
var AdapterClass = require("./" + adapterName);
var adapter = new AdapterClass(config);

function errorCallback(err) {
  console.log(err);
}
function successCallback(results) {
  console.log("==== Response ====");
  console.log("STATUS: " + results.status);
  var data = results.data;
  data.forEach(function(entity, index) {
    console.log("object " + index + ": id: " + entity.id + "; type: " + entity.type);
  });
}

//query for all books with field 653a = "algebraic"
console.log("sending query...");
adapter.query("marcRecord", [[["=", "653a", "algebraic"]]], true, successCallback, errorCallback);
//query by id
console.log("sending query for resolving an id...");
adapter.resolveId("100326", true, successCallback, errorCallback);
console.log("waiting for answer...");
