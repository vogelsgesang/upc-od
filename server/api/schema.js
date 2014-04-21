"use strict";
var Router = require("./router");

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
  res.json(schema);
}

function setSchema(req, res) {
  schema = req.body;
  res.json({type: "success", msg:"The schema was successfully replaced."});
  res.end();
}

function deleteSchema(req, res) {
  schema = {};
  res.json({type:"success", msg: "The schema was successfully reset."});
}

var schemaRouter = Router()
  .addRoute('/', {
    GET: schemaIndex,
    PUT: setSchema,
    DELETE: deleteSchema
  })

module.exports = schemaRouter;
