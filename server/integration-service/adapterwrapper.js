"use strict";
var Mapper = require("./mapper");
var Promise = require("bluebird");
var MemCache = require("memcached");
var Crypto = require("crypto");

// Connect to the memcached server with its private AWS IP address
var mcache = new MemCache('localhost:11211');
/*
 Function to identify is a object is Empty
 */
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

function KeyGenerator(sourceId) {
  //@Franz: this function has/had multiple issues:
  // 1. you did not take the sourceId into account. Hence, cache collisions between different sources were possible
  // 2. your sorting aproach makes some mistakes:
  //    F.e. the two field specifications [["a","b"], "c"] and ["a", ["b", "c"]] are both mapped to "a,b,c".
  //    But these two field specifications have different meanings.
  // 3. whitespaces are not handled correctly. The returned key must not contain whitespaces.
  this.generateKey = function(type, conditions, fields) {
    var key = sourceId + ":" + type + ";";
    var sField = "";
    var sConditions = "";
    var sortFields = [];
    var idxItm = 0;
    
    var arrFields = [];
    for(var i = 0; i < fields.length; i++) {
      arrFields.push(JSON.stringify(fields[i]));
    }
    
    arrFields = arrFields.sort();
    sField = arrFields.join(",");
    
    var arrConditions = [];
    for(var i = 0; i < conditions.length; i++) {
      arrConditions.push(JSON.stringify(conditions[i]));
    }
    
    arrConditions = arrConditions.sort();
    sConditions = arrConditions.join(",");
    
    key += "C:" + sConditions + ";F:" + sField;

    //hash it in order to get rid of whitespaces
    var chash = Crypto.createHash("md5");
    chash.update(key)
    key = chash.digest("hex");
    
    return key;
  }
}

/**
 * sets the configuration of the source with the according _id.
 * if no such source exists, it will be created.
 * throws on error
 */
function AdapterWrapper(sourceConfig) {
  var AdapterClass = require("../adapters/" + sourceConfig.adapter.name);
  var adapter = new AdapterClass(sourceConfig.adapter.config);
  var mapper = new Mapper(sourceConfig.mapping);
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
      if(mappedConditions === false) {
        resolve([]);
        return;
      }
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
            var mappedResults = mapper.mapInstancesFromSource(results, fields, sourceConfig._id);
            resolve(mappedResults);
          } else {
            // Key not found, fetch value from ORIGINAL source
            abortFunction = adapter.query(objectType, mappedConditions, mappedFields, function successCallback(results) {
              
              mcache.set(MCkey, results, 7200, function(err, result){
                if(err) console.error(err);
                else console.log("New query saved in cache: "+MCkey);
              });
               
              var mappedResults = mapper.mapInstancesFromSource(results, fields, sourceConfig._id);
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
