"use strict";
var EventEmitter = require('events').EventEmitter;
function ConsolidatedQuery(sources, objectDefinitions) {
  //necessary for inheriting from EventEmitter
  EventEmitter.call(this);

  //create independent copies for sources and object definitions.
  //these two variables shadow the parameters with the same name
  var tmpSources = {};
  Object.keys(sources).forEach(function(key) {
    tmpSources[key] = sources[key];
  });
  tmpSources = undefined;
  var tmpObjectDefinitions = {};
  Object.keys(objectDefinitions).forEach(function(key) {
    tmpObjectDefinitions[key] = objectDefinitions[key];
  });
  objectDefinitions = tmpObjectDefinitions;
  tmpObjectDefinitions = undefined;
  //create an index on the names of object definitions
  var objectDefinitionsByNames = {};
  Object.keys(objectDefinitions).forEach(function(key) {
    objectDefinitionsByNames[objectDefinitions[key].name] = objectDefinitions[key];
  });
  
  //stores all unresolved promises
  var unresolvedPromises = [];
  //collects all the results
  var results = {
    errors: [],
    data: []
  }

  //used by the following functions in order to access this
  var self = this;
  //Yes, JS is a little bit different with regards to the
  //handling of "this".

  //TODO: implement this function
  function removePosedQueries(queries) {
    //TODO: filter out queries which were already posed
    return queries;
  }

  //checks if we are already done and emits the "done" signal
  function checkDone() {
    if(unresolvedPromises.length == 0) {
      self.emit("done", results);
    }
  }

  //integrates new results
  //parameters:
  //  objects: the new objects which should be added to the consolidated data
  //  createNewObjects: should new objects be created, if the new data
  //    does represent a new object and can not be merged with already existing data
  function handleNewResults(objects, createNewObjects) {
    if(objects.length != 0) {
      //TODO: update the consolidated data
      Object.keys(objectDefinitions).forEach(function(key) {
        results.data = objectDefinitions[key].objectMerger.mergeWithObjects(results.data, objects, createNewObjects);
      });   
      results.data = results.data.concat(objects); //just for now; this will be replaced later
      //report progress
      self.emit("progress");
      //TODO:infer queries
      //var query = QueryDeducor.createQueriesFor(objectType, results.data);
      var query = []; //just for now; will be replaced later
      //filter out already posed parts of the query
      query = removePosedQueries(query);
      //pose new queries
      if(query.length != 0) {
        //TODO: broadcastQuery(conditions, false);
      } else {
        checkDone();
      }
    } else {
      checkDone();
    }
  }

  //adds promises to the list of unresolved promises
  //and registers the appropriate eventListeners
  function addPromises(promises, createNewObjects) {
    promises.forEach(function(promise) {
      var newPromise = promise.finally(function() {
        //remove this promise from the set of unresolved promises
        unresolvedPromises.splice(unresolvedPromises.indexOf(newPromise) ,1)
      })
      .then(function(objects) {
        handleNewResults(objects, createNewObjects);
      }).catch(function(e) {
        results.errors.push(e);
        self.emit("progress", null, e);
        checkDone();
      });
      unresolvedPromises.push(newPromise);
    });
    //we have to check this here since promises might have been an empty array.
    //and we must do this asynchronously! (hence, I am using process.nextTick)
    process.nextTick(checkDone); 
  }

  function broadcastQuery(objectType, conditions, fields, createNewObjects) {
    var newPromises = Object.keys(sources).map(function(sourceId) {
      return sources[sourceId].query(objectType, conditions, fields);
    });
    addPromises(newPromises, createNewObjects);
  }

  //adds a new query to the scope of interest of this
  //consolidated query
  this.addQueries = function addQueries(objectType, conditions) {
    //broadcasts a query to all sources
    var objDef = objectDefinitionsByNames[objectType];
    if(objDef == undefined) {
      //we must report errors asynchronously! (hence, I am using process.nextTick)
      process.nextTick(function() {
        var err = new Error("unknow object type: " + objectType)
        results.errors.push(err);
        self.emit("progress", null, err);
        checkDone(); //might be that we are done before even getting started
      });
    } else {
      var fields = objectDefinitionsByNames[objectType].fields;
      broadcastQuery(objectType, conditions, fields, true);
    }
  }

  //cancels this query
  this.cancel = function cancel() {
    //we must duplicate the array of promises here
    //since the promises remove themselves from the array
    //on cancelation. And modifying the array while looping
    //over it results in unexpected behaviour.
    var unresolvedCopy = unresolvedPromises.slice();
    unresolvedCopy.forEach(function(p) {p.cancel()});
    throw e; //Don't swallow the exception
  }
}
//inherit from EventEmitter
require('util').inherits(ConsolidatedQuery, EventEmitter);

module.exports = ConsolidatedQuery;
