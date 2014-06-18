"use strict";
//deduces queries based on already known facts
//and on the schema definition
function QueryDeducor(equality) {
  this.deduceQueries = function(facts) {
    //The parameter facts will contain all the facts which are already known about a specific object
    //(i.e. only obj.fields)
    //
    //returs an array of query conditions which can be used in order to query for additional
    //informations for a specific object. Returns an array of the following format:
    //[
    //  [
    //    ["=", "isbn", "1234"]
    //  ],
    //  [
    //    ["=", "isbn", "23456"]
    //  ]
    //]
    //This return value would have the meaning: search for all books with isbn 1234 or 23456
    //An example of this can be found on https://gist.github.com/vogelsgesang/27da988e271ff70a70ea
    var queries = [];
    for(var i = 0; i < equality.length; i++) {
      var conjunctiveClause = equality[i];
      queries = queries.concat(instantiateConjunctiveClause(conjunctiveClause, facts));
    }
    return queries;
  }

  //combines a conjunctive clause with facts and creates a set of queries
  function instantiateConjunctiveClause(conjunctiveClause, facts) {
    var queries = [[]];
    for(var i = 0; i < conjunctiveClause.length; i++) {
      var currentCondition = conjunctiveClause[i];
      //formulate the part of this query which is necessary for the current condition
      var currentQueryParts = [];
      if(currentCondition[0] == "=") {
        var fieldName = currentCondition[1];
        //do we already have informations about this field?
        if(facts[fieldName] === undefined) {
          //no informations about this field so far
          //=> this conjunctiveClause is not creating any queries.
          return [];
        } else {
          //create the additional conditions which will be added to the query later
          currentQueryParts = facts[fieldName].map(function(v) {return ["=", fieldName, v];});
        }
      } else {
        throw new Error("Unknown operator in equality definition: " + currentCondition[0]);
      }
      //combine these new query parts with the old query
      var prevQueries = queries;
      queries = [];
      prevQueries.map(function(q1) {
        currentQueryParts.forEach(function(q2) {
          queries.push(q1.concat([q2]));
        });
      });
    } //for
    return queries;
  }
}
module.exports = QueryDeducor;
