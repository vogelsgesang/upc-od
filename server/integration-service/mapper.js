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

  /*
   * rewrites a condition so that it can be passed to the source
   * Fields without a corresponding mapping should be removed from the array.
   * parameters: relevant mapping, conditions which should be rewritten
   * returns the rewritten conditions
   */
  function rewriteConditionsForSource(mapping, conditions) {
    return conditions;
  }
  this.rewriteConditionsForSource = rewriteConditionsForSource;

  /*
   * renames all fieldnames to the source's schema.
   * parameters: relevant mapping, array containing the field names to be renamed
   * returns the rewritten conditions
   */
  function renameFieldsForSource(mapping, fieldNames) {
    return fieldNames; //for later...
  }
  this.renameFieldsForSource = renameFieldsForSource;

  /*
   * maps the fields of a specific instance to the global schema.
   * parameters: relevant mapping, the values know for the field
   * returns the mapped properties
   */
  function mapInstanceFromSource(mapping, properties) {
    return parameters; //later...
  }
  this.mapInstanceFromSource = mapInstanceFromSource;
}
