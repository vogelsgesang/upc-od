"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");
var connect = require("connect");
var bodyParser = require("body-parser");

var schema = {
  'book': {
    'attributes': [
      {
        'name': 'title',
        'type': 'string'
      },
      {
        'name': 'author',
        'type': 'link'
      }
    ]
  },
  'author': {
    'attributes': [
      {
        'name': 'name',
        'type': 'string'
      },
      {
        'name': 'birthyear',
        'type': 'integer'
      }
    ]
  }
}

function schemaIndex(req, res) {
  sendJson(req, res, schema);
}

function setSchema(req, res) {
  schema = req.body;
  sendJson(req, res, {type: "success", msg:"The schema was successfully replaced."});
  res.end();
}

function deleteSchema(req, res) {
  schema = {};
  sendJson({type:"success", msg: "The schema was successfully reset."});
}

var schemaRouter = Router()
  .addRoute('/', {
    GET: schemaIndex,
    PUT: connect().use(bodyParser.json()).use(setSchema),
    DELETE: deleteSchema
  })

module.exports = schemaRouter;