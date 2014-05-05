var baucis = require("baucis");
var express = require("express");

//load the necessary models
require("../model/source");
require("../model/objectdefinition");
baucis.rest('Source');
baucis.rest('ObjectDefinition');

module.exports = express()
  .use(require("./delay-response")(800))
  .use(baucis());
