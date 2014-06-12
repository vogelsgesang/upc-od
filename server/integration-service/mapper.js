module.exports = function Mapper(mappings) {
  /*
   * returns the relevant mapping for a certain local type
   */
  function findMappingTo(internalType) {
    /*find inside mappings the entry where mappedType == internalType
    return this mapping*/
    var relevantMapping = null;
    for(var i = 0; i < mappings.length; i++) {
      var mapping = mappings[i];
      if(mapping["mappedType"] == internalType) {
        relevantMapping = mapping;
        break;
      }
    }
    return relevantMapping;
  }
  this.findMappingTo = findMappingTo;

  function findMappingFrom(internalType) {
    /*find inside mappings the entry where mappedType == internalType
    return this mapping*/
    var relevantMapping = null;
    for(var i = 0; i < mappings.length; i++) {
      var mapping = mappings[i];
      if(mapping["sourceType"] == internalType) {
        relevantMapping = mapping;
        break;
      }
    }
    return relevantMapping;
  }
  this.findMappingFrom = findMappingFrom;
  
  /*
   * rewrites a condition so that it can be passed to the source
   * Fields without a corresponding mapping should be removed from the array.
   * parameters: relevant mapping, conditions which should be rewritten
   * returns the rewritten conditions
   */
  function rewriteConditionsForSource(mapping, conditions) {
    var fieldMapping = mapping.fieldMapping;
    var defcondic = [];
    var andConditions = [];
    for(var i = 0; i < conditions.length; i++) {
      var fieldName = conditions[i][1];
      var newFieldname = fieldMapping[fieldName];
      if(newFieldname==undefined){
        console.log("Unknown field: " + fieldName);
      }
      else defcondic.push([conditions[i][0], newFieldname, conditions[i][2]]);
    }
    return defcondic;
  }
  this.rewriteConditionsForSource = rewriteConditionsForSource;

  /*
   * renames all fieldnames to the source's schema.
   * parameters: relevant mapping, array containing the field names to be renamed
   * returns the rewritten fieldnames
   */
  function renameFieldsForSource(mapping, fieldNames) {
    var fieldMapping = mapping.fieldMapping;
    var defFieldN = [];
    
    for(var i = 0; i < fieldNames.length; i++) {
      var fieldName = fieldNames[i];
      var vFieldname = fieldMapping[fieldName];
      
      if(vFieldname==undefined)
        console.log("Unknown field: " + fieldName); 
      else defFieldN.push(vFieldname);
    }
    
    return defFieldN;
  }
  this.renameFieldsForSource = renameFieldsForSource;

  
  
  function flattenArray(arr) {
    var flattened = [];
    for(var i = 0; i < arr.length; i++) {
      if(arr[i] instanceof Array) {
        flattened = flattened.concat(flattenArray(arr[i]));
      } else {
        flattened.push(arr[i]);
      }
    }
    return flattened;
  }
  /*
   * maps the fields of a set of instances to the global schema.
   * parameters:
   *  * an array containing all the instances which should be mapped
   *  * the fields which should be extracted from this source
   * returns the instances with the mapped properties
   */
  function mapInstancesFromSource(instances, fields) {
    var definitelyInstances = [];
    
    for(var i = 0;i < instances.length; i++){
      var originalInstance = instances[i];
      var mapping = this.findMappingFrom(originalInstance.type);
      var mappedFields = {};

      //remap the fields
      var fMapp = mapping.fieldMapping;
      if(fMapp == undefined) fMapp = {};
      for(var j = 0; j < fields.length; j++) {
        var currentFieldName = fields[j];
        var currentPath = fMapp[currentFieldName];
        if(currentPath == null) continue;
        //extract the content of the instance which is saved under currentPath
        var currentFieldContent = [instances[i].fields]; //scratch space for extracting the data
        var notFound = false;
        for(var k = 0; k < currentPath.length; k++) {
          var fieldID = currentPath[k];
          var subFieldContent = []; //the content after flattening out the current path component
          for(var l = 0; l < currentFieldContent.length; l++) {
            var subField = currentFieldContent[l][fieldID];
            if(subField !== undefined) {
              subFieldContent.push(subField);
            }
          }
          //flatten arrays
          currentFieldContent = flattenArray(subFieldContent);
          if(currentFieldContent.length == 0) {
            notFound = true;
            break;
          }
        }
        if(!notFound) {
          mappedFields[currentFieldName] = currentFieldContent;
        }
      }
      var mappedInstance = {
        id: originalInstance.id,
        type: mapping.mappedType,
        fields: mappedFields
      };
      definitelyInstances.push(mappedInstance);
    }
    return definitelyInstances;
  }
  this.mapInstancesFromSource = mapInstancesFromSource;
}
