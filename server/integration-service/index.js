"use strict";
var AdapterWrapper = require("./adapterwrapper");
var Promise = require("bluebird");

function IntegrationService() {
  var sources = {};

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
    return sources[sourceId].query(objectType, conditions, fields);
  }

  this.destroy = function() {
    Object.keys(sources).forEach(function(id) {
      sources[id].destroy();
    });
    sources = {};
  }

  //queries the consolidated view.
  this.query = function query(objectType, conditions) {
    var unresolvedPromises = [];
    var resultsPromise = new Promise(function (resolve, reject) {
      var results = {
        errors: [],
        data: []
      }

      //which fields should we search for?
      var fields = [];//TODO: lookup fields

      function removePosedQueries(queries) {
        //TODO: filter out queries which were already posed
        return queries;
      }

      //integrates new results
      function handleNewResults(objects, createNewObjects) {
        if(objects.length != 0) {
          //TODO: update the consolidated data
          //var changed = duplicateMerger.mergeWithObjects(results.data, objects, createNewObjects);
          results.data = results.data.concat(objects); //just for now; this will be replaced later
          //report progress
          //resultsPromise.progress(results);
          //TODO:infer queries
          //var query = QueryDeducor.createQueriesFor(objectType, results.data);
          var query = []; //just for now; will be replaced later
          //filter out already posed parts of the query
          query = removePosedQueries(query);
          //pose new queries
          if(query.length != 0) {
            broadcastQuery(conditions, false);
          } else if(unresolvedPromises.length == 0) {
            resolve(results);
          }
        }
      }
      function addPromises(promises, createNewObjects) {
        promises.forEach(function(promise) {
          var newPromise = promise.finally(function() {
            //remove this promise from the set of unresolved promises
            unresolvedPromises.splice(unresolvedPromises.indexOf(newPromise) ,1)
          })
          .then(function(objects) {
            handleNewResults(objects, createNewObjects);
          }).catch(function(e) {
            results.errors.push("" + e); //TODO: resultsPromise.progress(results)
          });
          unresolvedPromises.push(newPromise);
        });
      }
      //broadcasts a query to all sources
      function broadcastQuery(conditions, createNewObjects) {
        var newPromises = Object.keys(sources).map(function(sourceId) {
          return sources[sourceId].query(objectType, conditions, fields);
        });
        addPromises(newPromises, createNewObjects);
      }
      broadcastQuery(conditions, true);
    }).cancellable().catch(Promise.CancellationError, function(e) {
      //we must duplicate the array of promises here
      //since the promises remove themselves from the array
      //on cancelation. And modifying the array while looping
      //over it results in unexpected behaviour.
      var unresolvedCopy = unresolvedPromises.slice();
      unresolvedCopy.forEach(function(p) {p.cancel()});
      throw e; //Don't swallow the exception
    });
    return resultsPromise;
  }
}

module.exports = IntegrationService;
