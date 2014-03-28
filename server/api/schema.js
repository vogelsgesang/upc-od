"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");

var schema = {
  "test1": "a",
  "test2": 2
}
schema.test3 = "b";
schema.teamMember = [
  {
    firstName: "Maryam",
    surname: "Pashmi"
  },
  {
    firstName: "Adrian",
    surname: "Vogelsgesang"
  },
  {
    firstName: "Franz"
  }
]

function schemaIndex(request, response, opts) {
  sendJson(request, response, schema);
}

var schemaRouter = Router()
  .addRoute('/', {
    GET: schemaIndex
    //DELETE: deleteSchema,
  })

module.exports = schemaRouter;
