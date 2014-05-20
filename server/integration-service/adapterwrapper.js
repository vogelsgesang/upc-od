"use strict";
var Mapper = require("./mapper");
var Promise = require("bluebird");

/**
 * sets the configuration of the source with the according _id.
 * if no such source exists, it will be created.
 * throws on error
 */
function AdapterWrapper(sourceConfig) {
  var AdapterClass = require("../adapters/" + sourceConfig.adapter.name);
  var mapper = new Mapper(sourceConfig.mapping);
  var adapter = new AdapterClass(sourceConfig.adapter.config);

  /**
   * forwards the query to the corresponding adapter and
   * provides the results to the callback. Schema remapping is handled,
   * i.e. the query should be posed in the global schema and the results
   * will be returned in the global schema. Translating from the global to
   * the source schema and vice versa will be handled internally.
   *
   * This function returns a cancellable Bluebird promise.
   */
  this.query = function(objectType, conditions, fields) {
    var abortFunction;
    return new Promise(function (resolve, reject) {
      //apply the mapping from the consolidated schema to the source schema
      var relevantMapping = mapper.findMappingTo(objectType);
      if(relevantMapping == null){
        resolve([]);
        return;
      }
      objectType = relevantMapping["sourceType"];
      conditions = mapper.rewriteConditionsForSource(relevantMapping, conditions);
      fields = mapper.renameFieldsForSource(relevantMapping, fields);
      //check if it is in our cache?
      //if yes: send results from cache
      //else: send the query to the original source
      //send the query
      abortFunction = adapter.query(objectType, conditions, fields, function successCallback(results) {
        results = mapper.mapInstancesFromSource(results);
        resolve(results);
      }, function errorCallback(error) {
        reject(error);
      })
    }).cancellable().catch(Promise.CancellationError, function(e) {
      abortFunction();
      throw e; //Don't swallow the exception
    });
  }

  this.destroy = function() {
    adapter.destroy();
  }
}
module.exports = AdapterWrapper;
