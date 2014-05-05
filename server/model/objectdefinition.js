"use strict";
var mongoose = require('mongoose');

var objectDefinitionSchema = mongoose.Schema({
  name: String,
  fields: [String],
  equality: mongoose.Schema.Types.Mixed
});

var ObjectDefinition = mongoose.model('ObjectDefinition', objectDefinitionSchema);
module.exports = {
  model: ObjectDefinition,
  schema: objectDefinitionSchema
}
