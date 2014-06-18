//deduces queries based on already known facts
//and on the schema definition
function QueryDeducor(equality) {
  this.deduceQueries = function(facts) {
    //The parameter facts will contain all the facts which are already known about a specific object
    //(i.e. only obj.fields)
    //
    //returs an array of query conditions which can be used in order to query for additional
    //informations for a specific object. Return an array of the following format:
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
    
  }
}
module.exports = QueryDeducor;
