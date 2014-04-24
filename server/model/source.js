"use strict";
var mongoose = require('mongoose');

var sourceSchema = mongoose.Schema({
  name: String,
  adapter: {
    name: String,
    config: mongoose.Schema.Types.Mixed
  },
  mapping: [mongoose.Schema.Types.Mixed]
});

var Source = mongoose.model('Source', sourceSchema);
module.exports = {
  model: Source,
  schema: sourceSchema
}
