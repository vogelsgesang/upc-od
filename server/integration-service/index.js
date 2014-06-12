"use strict";
var Promise = require("bluebird");
var AdapterWrapper = require("./adapterwrapper");
var ConsolidatedQuery = require("./consolidated-query");
var QueryDeducor = require("./querydeducor");
var ObjectMerger = function(){}; //place holder

function IntegrationService() {
  var sources = {};
  var objectDefinitions = {};

  /**
   * sets the configuration of the source with the according _id.
   * if no such source exists, it will be created.
   * throws on error
   */
  this.configureSource = function createSource(sourceConfig) {
    var newAdapterWrapper = new AdapterWrapper(sourceConfig);
    if(Object.keys(sources).indexOf(""+sourceConfig._id) >= 0) {
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

  //returns all source configurations; just for debugging...
  this.getSources = function getSources()  {
    return sources;
  };

  /**
   * adds/updates an object definition
   */
  this.configureObjectDefinition = function(objectConfig) {
    var newQueryDeducor = new QueryDeducor(objectConfig.equality);
    var newObjectMerger = new ObjectMerger(objectConfig.equality);
    if(Object.keys(objectDefinitions).indexOf(""+objectConfig._id) >= 0) {
      this.removeObjectDefinition(objectConfig._id);
    }
    objectDefinitions[objectConfig._id] = {
      id: objectConfig._id,
      name: objectConfig.name,
      fields: objectConfig.fields,
      queryDeducor: newQueryDeducor,
      objectMerger: newObjectMerger
    };
  }

  /**
   * removes the object definition with the corresponding id
   */
  this.removeObjectDefinition = function(id) {
    if(Object.keys(objectDefinitions).indexOf(""+id) >= 0) {
      var name = objectDefinitions[id].name;
      delete objectDefinitions[id];
    }
  }

  /**
   * forwards the query to a specific wrapper for an adapter.
   * This function returns a cancellable Bluebird promise.
   */
  this.querySource = function(sourceId, objectType, conditions, fields) {
    if(Object.keys(sources).indexOf(""+sourceId) < 0) {
      return Promise.rejected(new Error("No such source"));
    }
    return sources[sourceId].query(objectType, conditions, fields);
  }

  this.destroy = function() {
    Object.keys(sources).forEach(function(id) {
      sources[id].destroy();
    });
    sources = {};
  }

  //creates a new consolidated query and returns this
  //new ConsolidatedQuery instance
  this.createConsolidatedQuery = function createConsolidatedQuery() {
    return new ConsolidatedQuery(sources, objectDefinitions);
  }
}

module.exports = IntegrationService;
