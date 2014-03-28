"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");

var schema = {
  "test1": "a",
  "test2": 2
}

function schemaIndex(req, res) {
  sendJson(req, res, schema);
}

function setSchema(req, res) {

}

function deleteSchema(req, res) {
  schema = {};
  sendJson({type:"success", msg: "The schema was successfully reset."});
}

var schemaRouter = Router()
  .addRoute('/', {
    GET: schemaIndex,
    PUT: setSchema,
    DELETE: deleteSchema
  })

module.exports = schemaRouter;
