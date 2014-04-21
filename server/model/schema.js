"use strict";
var mongoose = require('mongoose');

var objectDefinitionSchema = mongoose.Schema({
  name: String,
  properties: [String],
  links: [String],
  displayAs: [String],
  equality: mongoose.Schema.Types.Mixed
});

var ObjectDefinition = mongoose.model('ObjectDefinition', objectDefinitionSchema);
module.exports = ObjectDefinition;
