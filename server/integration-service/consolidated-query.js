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
  var objectDefinitionsByName = {};
  Object.keys(objectDefinitions).forEach(function(key) {
    objectDefinitionsByName[objectDefinitions[key].name] = objectDefinitions[key];
  });
  
  //stores all unresolved promises
  var unresolvedPromises = [];
  //collects all the results
  var results = {
    errors: [],
    data: []
  }

  var posedQueries = [];
  //creates a normalized (!) string representation of a conjunctive clause
  function hashQuery(objType, query) {
    var stringifiedConditions = query.map(function(c) {
      return JSON.stringify(c);
    });
    var normalizedHash = objType + ";" + stringifiedConditions.sort().join(",");
    return normalizedHash;
  }
  //was this query already posed
  function queryAlreadyPosed(objType, query) {
    var normalizedHash = hashQuery(objType, query);
    return posedQueries.indexOf(normalizedHash) !== -1;
  }
  //remembers a query as being already posed
  function rememberPosedQuery(objType, query) {
    var normalizedHash = hashQuery(objType, query);
    posedQueries.push(normalizedHash);
  }

  //used by the following functions in order to access the reference to this
  var self = this;
  //Yes, JS is a little bit different with regards to the handling of "this".


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
      //update the consolidated data
      objects.forEach(function(newObject) {
        var type = newObject.type;
        var objectDefinition = objectDefinitionsByName[type];
        if(objectDefinition) {
          results.data = objectDefinition.objectMerger.addNewObject(results.data, newObject, createNewObjects);
        } else {
          results.data = results.data.concat(newObject);
        }
      });
      //report progress
      self.emit("progress", null, results);
      //infer queries and broadcast them
      results.data.forEach(function(obj) {
        var deducedQueries = objectDefinitionsByName[obj.type].queryDeducor.deduceQueries(obj.fields);
        deducedQueries.forEach(function(query) {
          broadcastQuery(obj.type, query, false);
        });
      });
    }
  }

  //adds promises to the list of unresolved promises
  //and registers the appropriate eventListeners
  function addPromises(promises, createNewObjects) {
    promises.forEach(function(promise) {
      var newPromise = promise
      .then(function(objects) {
        handleNewResults(objects, createNewObjects);
      }).then(function() {
        //remove this promise from the set of unresolved promises
        unresolvedPromises.splice(unresolvedPromises.indexOf(newPromise) ,1)
        checkDone();
      }).catch(function(e) {
        //remove this promise from the set of unresolved promises
        unresolvedPromises.splice(unresolvedPromises.indexOf(newPromise) ,1)
        //add the error to the list of errors
        results.errors.push(e);
        self.emit("progress", e, results);
        //check if we are already done
        checkDone();
      });
      unresolvedPromises.push(newPromise);
    });
    //we have to check this here since promises might have been an empty array.
    //and we must do this asynchronously! (hence, I am using process.nextTick)
    process.nextTick(checkDone); 
  }

  //used internally in order to broadcast a query
  //if this query was already broadcasted before, this function does nothing.
  function broadcastQuery(objectType, conditions, createNewObjects) {
    if(queryAlreadyPosed(objectType, conditions) && !createNewObjects) {
      return;
    }
    //broadcasts a query to all sources
    var objDef = objectDefinitionsByName[objectType];
    if(objDef == undefined) {
      //we must report errors asynchronously! (hence, I am using process.nextTick)
      process.nextTick(function() {
        var err = new Error("unknow object type: " + objectType)
        results.errors.push(err);
        self.emit("progress", err, results);
        checkDone(); //might be that we are done before even sending the (first) query...
      });
    } else {
      var fields = objDef.fields;
      var newPromises = Object.keys(sources).map(function(sourceId) {
        return sources[sourceId].query(objectType, conditions, fields);
      });
      rememberPosedQuery(objectType, conditions);
      addPromises(newPromises, createNewObjects);
    }
  }

  //adds a new query to the scope of interest of this
  //consolidated query
  this.addQuery = function addQuery(objectType, conditions) {
    //broadcasts a query to all sources
    broadcastQuery(objectType, conditions, true);
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
