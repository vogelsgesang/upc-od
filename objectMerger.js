//in line: var ObjectMerger = require("./objectMerger");
//so object merger iterate over values returned by one query and check if the 'equality' parameters are equal with what is already in memory
//(resultsData) when they are equal the two equal objects are merged together id is merged like that : s1:id1;s2;id2

//the merger is called in this line:results.data = objectDefinitions[key].objectMerger.mergeWithObjects(results.data, objects, createNewObjects);
//(in consolidated-query) ,it is updating recursively as the next responce is comming the fields should by merged like that when the field of name for ex: query1: "publishingYear" = 1984" query2: "publishingYear" = 1985" then it schould be like that: "publishingYear": ["1984", "1985"] when equal years then only 1984
//when the fields names are equal, but values different,thats missing

function ObjectMerger(equality) {
  
  this.mergeWithObjects = function(resultsData, objects, createNewObjects) {
    console.log("equality: " + equality); 
    objects.forEach(function(obj1) {
      //prototype of the constructed object
      var objToAdd=obj1;
      resultsData.forEach(function(obj2){
        if(isEqual(equality, obj1, obj2)){
          console.log("equality found:");
          console.log(require('util').inspect(obj1, false, null));
          console.log(require('util').inspect(obj2, false, null));
          //here we modify found equal object instead of creating new one
          obj2.id="s1:"+obj1.id+";s2:"+obj2.id;
          //Concatenate returned fields
          // TODO: if fields differs than make a union of them like "title": ["Rheumatology", "Rheumatology in Praxis"]
          resultFields={}
          for(var key in obj1.fields) resultFields[key] = obj1.fields[key];
          for(var key in obj2.fields) {
	    if(resultFields[key] !== undefined) {
	      resultFields[key] = resultFields[key].concat(obj2.fields[key]);
	    } else {
	      resultFields[key] = obj2.fields[key];
	    }
	  }
          obj2.fields=resultFields;
          //avoiding to add this obj
          objToAdd=null;
        }
      });
      if(objToAdd!=null)
        resultsData.concat(objToAdd);
    });
    return resultsData;
  }
}
function isEqual(equality,obj1, obj2){
  retVal = equality.every(function(condition) {
    var f = condition[0][1];
    if((obj1.fields[f]!==undefined)||(obj2.fields[f]!==undefined)||obj1.fields[f][0]===obj2.fields[f][0]){
      return true;
    }
  });
  return false;
}
module.exports = ObjectMerger;