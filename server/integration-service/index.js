"use strict";

var Mapper = require("./mapper");

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
    if(Object.keys(sources).indexOf(sourceConfig._id) >= 0) {
      removeSource(sourceConfig._id);
    }
    sources[sourceConfig._id] =  {
      adapter: adapter,
      mapper: new Mapper(sourceConfig.mapping)
    }
  };

  /**
   * removes the source with the corresponding id
   */
  this.removeSource = function removeSource(id) {
    if(Object.keys(sources).indexOf(id) >= 0) {
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
    if(Object.keys(sources).indexOf(sourceId) < 0) {
      process.nextTick(function(){callback(new Error("No such source"), null)});
      return function() {};
    }
    //get the mapper and the adapter
    var mapper = sources[sourceId].mapper;
    var adapter = sources[sourceId].adapter;
    //apply the mapping from the consolidated schema to the source schema
    /*4Franz:
    var relevantMapping = mapper.findMappingTo(objectType);
    objectType = relevantMapping["sourceType"];
    conditions = mapper.rewriteConditionsForSource(relevantMapping, conditions);
    fields = mapper.renameFieldsForSource(relevantMapping, fields);
    */
    //objectType = relevantMapping["sourceType"]; //4Franz
    return adapter.query(objectType, conditions, fields, function successCallback(results) {
      //4Franz: for later
      //results.fields = mapper.mapInstanceFromSource(relevantMapping, results.fields);
      callback(null, results);
    }, function errorCallback(error) {
      callback(error, null);
    })
  }

  this.destroy = function() {
    for(var id in Object.keys(sources)) {
      sources[id].destroy();
    }
    sources = {};
  }
}

module.exports = IntegrationService;
