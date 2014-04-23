"use strict";

function IntegrationService() {
  var sources = {};

  /**
   * sets the configuration of the source with the according _id.
   * if no such source exists, it will be created.
   * throws on error
   */
  this.configureSource = function createSource(sourceConfig) {
    var AdapterClass = require("../adapters/" + sourceConfig.adapter.name);
    var adapter = new AdapterClass(sourceConfig.adapter.config);
    if(sourceConfig._id in Object.keys(sources)) {
      removeSource(sourceConfig._id);
    }
    sources[sourceConfig._id] = adapter;
  };

  /**
   * removes the source with the corresponding id
   */
  this.removeSource = function removeSource(id) {
    if(id in Object.keys(sources)) {
      sources[id].destroy();
      delete sources[id];
    }
  };

  this.getSources = function getSources()  {
    return sources;
  };

  /**
   * forwards the query to all sources and provides their results using the callback.
   * It provides the results as an object containing the id of the source together with
   * the results returned by this source.
   */
  this.rawQuery = function(conditions, fields, callback) {
    var results = {};
    for(id in Object.keys(sources)) {
      var source = sources[id];
      source.query(conditions, fields, function successCallback(results) {
        results[id] = results;
      }, function errorCallback(error) {
        results[id] = error;
      })
    }
  }

  this.destroy = function() {
    for(id in Object.keys(sources)) {
      sources[id].destroy();
    }
    sources = {};
  }
}

module.exports = IntegrationService;
