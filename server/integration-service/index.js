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
   * forwards the query to a specific source identified by its id and
   * provides their results to the callback. Schema remapping is handled,
   * i.e. the query should be posed in the global schema and the results
   * will be returned in the global schema. Translating from the global to
   * the source schema and vice versa will be handled internally.
   *
   * The callback will be called as callback(err, results), where err
   * is an instance of Error in case of an error and null otherwise.
   * If an error occured, results will be null. Otherwise it will contain
   * the actual results.
   *
   * This function returns a function which can be called in order to abort
   * the request.
   */
  this.querySource = function(sourceId, objectType, conditions, fields, callback) {
    var results = {};
    if(Object.keys(sources).indexOf(""+sourceId) < 0) {
      process.nextTick(function(){callback(new Error("No such source"), null)});
      return function() {};
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
