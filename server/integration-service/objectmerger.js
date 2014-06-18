//ObjectMergers are responsible for merging multiple representation of the same object together.
//Every instance of this class takes care of only one object type.
//The class constructor expects the definition of equality of this object type.
function ObjectMerger(equality) {

  this.addNewObject = function(mergedData, newObject, createNewObjects) {
    //search for all duplicates in the mergedData
    var allDuplicatesIndices = [];
    var allDuplicates = [];
    for(var i = 0; i < mergedData.length; i++) {
      if(isEqual(equality, newObject, mergedData[i])){
        allDuplicatesIndices.push(i);
        allDuplicates.push(mergedData[i]);
      }
    }
    if(allDuplicates.length) {
      //merge all the duplicates together with the new object into one single object
      allDuplicates.push(newObject);
      var mergedObject = mergeObjects(allDuplicates);
      //remove the old duplicates
      //here, we must make sure to remove the objects in the correct order
      //(otherwise we would have problems because the array indices are changing...)
      allDuplicatesIndices.sort().reverse().forEach(function(idx) {
        mergedData.splice(idx, 1);
      });
      //add the new object
      mergedData.push(mergedObject);
    } else if(createNewObjects) {
      //if the newObject is not a duplicate of already existing data, then
      //add it as a new object, but only if createNewObjects is true
      mergedData.push(newObject);
    }
    return mergedData;
  }

  function mergeObjects(objects) {
    var merged = {};
    //merge the ids
    merged.id = [];
    objects.forEach(function(obj) {
      if(obj.id instanceof Array) {
        merged.id = merged.id.concat(obj.id);
      } else {
        merged.id.push(obj.id);
      }
    });
    //I simply use the type of the first merged object.
    //The type of all objects which have to be merged is the same, anyway.
    merged.type = objects[0].type;
    //merge the fields
    merged.fields = {};
    objects.forEach(function(obj) {
      Object.keys(obj.fields).forEach(function(fieldName) {
        if(merged.fields[fieldName] === undefined) {
          //this field does not exist so far => create it!
          merged.fields[fieldName] = obj.fields[fieldName];
        } else {
          //this field already exists. Hence we will have to merge the according arrays together.
          merged.fields[fieldName] = merged.fields[fieldName].concat(obj.fields[fieldName]);
        }
      });
    });
    //during the procedure above, we may have introduced duplicate values on the fields.
    //Let's remove these duplicated values now:
    Object.keys(merged.fields).forEach(function (fieldName) {
      merged.fields[fieldName] = merged.fields[fieldName].filter(function(elem, pos, arr) {
        return arr.indexOf(elem) == pos;
      });
    });
    return merged;
  }

  function isEqual(equality, obj1, obj2){
    //first, make sure that the objects have the same type
    if(obj1.type !== obj2.type) {
      return false;
    } else {
      //check all conditions using Array.prototype.some
      var retVal = equality.some(function(condition) {
        var conditionType = condition[0];
        if(conditionType == "=") {
          var fieldName = condition[1];
          if((obj1.fields[fieldName]!==undefined)&&(obj2.fields[fieldName]!==undefined)){
            if(obj1.fields[fieldName][0]===obj2.fields[fieldName][0]) { //TODO: better equality checking
              return true;
            } else {
              return false
            }
          } else {
            return false;
          }
        }
      }); //equality.some
      return retVal;
    }
  }
}
module.exports = ObjectMerger;
