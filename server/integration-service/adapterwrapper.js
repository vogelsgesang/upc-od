"use strict";
var Mapper = require("./mapper");
var Promise = require("bluebird");
var MemCache = require("memcached");

// Connect to the memcached server with its private AWS IP address
var mcache = new MemCache('localhost:11211');

/*
 Function to identify is a object is Empty
 */
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

function KeyGenerator(sourceId) {
  this.generateKey = function(type, conditions, fields) {
    var key = type + ";";
    var sField = "";
    var sConditions = "";
    
    if(isEmptyObject(conditions)){
      if(isEmptyObject(fields)){
        key = "ALL";
      }
      else {
        var arrFields = fields.toString().split(",");
        
        arrFields = arrFields.sort();
        sField = arrFields.join(",");
        key = "F:" + sField;
      }
    }
    else{
      if(isEmptyObject(fields)){
        var arrConditions = conditions.toString().split(",");
        
        arrConditions = arrConditions.sort();
        sConditions = arrConditions.join(",");
        key = "C:" + sConditions;
      }
      else {
        var arrFields = fields.toString().split(",");
        var arrConditions = conditions.toString().split(",");
        
        arrConditions = arrConditions.sort();
        sConditions = arrConditions.join(",");
        arrFields = arrFields.sort();
        sField = arrFields.join(",");
        
        key = "C:" + sConditions + ";F:" + sField;
      }
    }
    
    return sourceId + ":" +key;
  }
}

/**
 * sets the configuration of the source with the according _id.
 * if no such source exists, it will be created.
 * throws on error
 */
function AdapterWrapper(sourceConfig) {
  var AdapterClass = require("../adapters/" + sourceConfig.adapter.name);
  var mapper = new Mapper(sourceConfig.mapping);
  var adapter = new AdapterClass(sourceConfig.adapter.config);
  var keygenerator = new KeyGenerator(sourceConfig._id);

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
      var mappedConditions = mapper.rewriteConditionsForSource(relevantMapping, conditions);
      var mappedFields = mapper.renameFieldsForSource(relevantMapping, fields);
      
      var MCkey = keygenerator.generateKey(objectType, mappedConditions, mappedFields);
      
      //check if it is in our cache?
      //if yes: send results from cache
      //else: send the query to the original source
      //send the query
      mcache.get(MCkey, function(err, results) {
          if (!err && results) {
            // Key found in cache, return value
            console.log("Query has been found in cache: "+MCkey);
            var mappedResults = mapper.mapInstancesFromSource(results, fields);
            resolve(mappedResults);
          } else {
            // Key not found, fetch value from ORIGINAL source
            abortFunction = adapter.query(objectType, mappedConditions, mappedFields, function successCallback(results) {
              
              mcache.set(MCkey, results, 7200, function(err, result){
                if(err) console.error(err);
                else console.log("New query saved in cache: "+MCkey);
              });
               
              var mappedResults = mapper.mapInstancesFromSource(results, fields);
              resolve(mappedResults);
            }, function errorCallback(error) {
              reject(error);
            });
          }
      });
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
