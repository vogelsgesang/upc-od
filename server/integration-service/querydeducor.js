function QueryDeducor(schemaDefinition) {
  //deduces queries based on already known facts
  //and on the schema definition
  this.deduceQueries = function(facts) {
    //you can access the schema definition using the variable schemaDefinition.
    //I think that the equality definition schemaDefinition.equality is of special interest for you.
    //The parameter facts will contain all the facts which are already known about a specific object
    //(i.e. only the fields)
    //
    //Please return an array of query conditions which can be used in order to query for additional
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
    //
    //for now, I just return an empty array. Just remove the following line as soon as you have something useful
    return [];
  }
}
module.exports = QueryDeducor;
