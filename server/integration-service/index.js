"use strict";
var AdapterWrapper = require("./adapterwrapper");

function IntegrationService() {
  var sources = {};

  /**
   * sets the configuration of the source with the according _id.
   * if no such source exists, it will be created.
   * throws on error
   */
  this.configureSource = function createSource(sourceConfig) {
    console.log("updating");
    var newAdapterWrapper = new AdapterWrapper(sourceConfig);
    if(Object.keys(sources).indexOf(""+sourceConfig._id) >= 0) {
      console.log("r");
      this.removeSource(sourceConfig._id);
    }
    sources[sourceConfig._id] = newAdapterWrapper;
  };

  /**
   * removes the source with the corresponding id
   */
  this.removeSource = function removeSource(id) {
    if(Object.keys(sources).indexOf(""+id) >= 0) {
      sources[id].destroy();
      delete sources[id];
    }
  };

  this.getSources = function getSources()  {
    return sources;
  };

  /**
   * forwards the query to a specific wrapper for an adapter.
   * This function returns a cancellable Bluebird promise.
   */
  this.querySource = function(sourceId, objectType, conditions, fields) {
    if(Object.keys(sources).indexOf(""+sourceId) < 0) {
      return Promise.rejected(new Error("No such source"));
    }
    return sources[sourceId].query(objectType, conditions, fields, callback);
  }

  this.destroy = function() {
    Object.keys(sources).forEach(function(id) {
      sources[id].destroy();
    });
    sources = {};
  }
}

module.exports = IntegrationService;
