/**
 * So far, this is just a draft!
 * THIS FILE DOES NOT CONTAIN WORKING JAVASCRIPT CODE
 */
//var duplicateMerger = new DuplicateMerger(); //TODO: implement this one
//var queryDeducor = new QueryDeducor(); //TODO: implement this one
function query(objectType, conditions) {
  var unresolvedPromises = [];
  var resultsPromise = new Promise(function (resolve, reject) {
    var results = {
      errors: []
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
        results.data.push(objects); //just for now; this will be replaced later
        //report progress
        resultsPromise.progress(results);
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
        newPromise = promise
        .then(function(objects) {
          handleNewResults(objects, createNewObjects);
        }).catch(function(e) {
          results.errors.push(e); resultsPromise.progress(results)
        }).finally(function() {
          //remove this promise from the set of unresolved promises
          unresolvedPromises.splice(unresolvedPromises.indexOf(newPromise) ,1)
        });
        unresolvedPromises.push(newPromise);
      });
    }
    //broadcasts a query to all sources
    function broadcastQuery(conditions, createNewObjects) {
      var newPromises = sources.map(function(source) {
        return source.query(objectType, conditions, fields);
      }
      addPromises(newPromises, createNewObjects);
    }
    broadcastQuery(conditions, true);
  }.cancellable().catch(Promise.CancellationError, function(e) {
    //we must duplicate the array of promises here
    //since the promises remove themselves from the array
    //on cancelation. And modifying the array while looping
    //over it results in unexpected behaviour.
    unresolvedCopy = unresolvedPromises.slice();
    unresolvedCopy.forEach(function(p) {p.cancel()};
    throw e; //Don't swallow the exception
  });
}
