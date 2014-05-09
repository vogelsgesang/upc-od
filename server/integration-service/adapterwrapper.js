"use strict";
var Mapper = require("./mapper");

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
   * The callback will be called as callback(err, results), where err
   * is an instance of Error in case of an error and null otherwise.
   * If an error occured, results will be null. Otherwise it will contain
   * the actual results.
   *
   * This function returns a function which can be called in order to abort
   * the request.
   */
  this.query= function(objectType, conditions, fields, callback) {
    //apply the mapping from the consolidated schema to the source schema
    var relevantMapping = mapper.findMappingTo(objectType);
    if(relevantMapping == null){
      callback(null, {});
      return;
    }
    objectType = relevantMapping["sourceType"];
    conditions = mapper.rewriteConditionsForSource(relevantMapping, conditions);
    fields = mapper.renameFieldsForSource(relevantMapping, fields);
    objectType = relevantMapping["sourceType"];
    return adapter.query(objectType, conditions, fields, function successCallback(results) {
      //first, remap the results
      results = mapper.mapInstancesFromSource(results);
      callback(null, results);
    }, function errorCallback(error) {
      callback(error, null);
    })
  }

  this.destroy = function() {
    adapter.destroy();
  }
}

module.exports = AdapterWrapper;
