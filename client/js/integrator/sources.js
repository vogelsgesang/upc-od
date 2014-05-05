"use strict";
(function(angular) {
angular.module('Sources', ['ngResource', 'mgcrea.ngStrap'])
.factory('Sources', createBaucisResourceFactory('sources'))
.controller('SourceOverview', createOverviewController({
  resourceName: 'Sources',
  scopeVariable: 'sources'
}))
.controller('SourceCreator', createCreatorController({
  resourceName: 'Sources',
  scopeVariable: 'source',
  initialValue: {'adapter':{'config':'{}'}, 'mapping': '[]'},
  transformForSave: function(source) {
    var source = angular.copy(source);
    try {
      source.adapter.config = JSON.parse(source.adapter.config);
    } catch(e) {
      throw new Error("Adapter configuration of the source must be valid JSON");
    }
    try {
      source.mapping = JSON.parse(source.mapping);
    } catch(e) {
      throw new Error("Mapping must be valid JSON");
    }
    return source;
  },
  afterSaveRedirection: '/sources'
}))
.controller('SourceEditor', createEditorController({
  resourceName: 'Sources',
  scopeVariable: 'source',
  initialValue: {'adapter':{'config':'{}'}, 'mapping': '[]'},
  transformOnLoad: function(source) {
    if(source.adapter.config === undefined) {
      source.adapter.config = {};
    }
    source.adapter.config = JSON.stringify(source.adapter.config, null, 4);
    source.mapping = JSON.stringify(source.mapping, null, 4);
    return source;
  },
  transformForSave: function(source) {
    var source = angular.copy(source);
    try {
      source.adapter.config = JSON.parse(source.adapter.config);
    } catch(e) {
      throw new Error("Adapter configuration of the source must be valid JSON");
    }
    try {
      source.mapping = JSON.parse(source.mapping);
    } catch(e) {
      throw new Error("Mapping must be valid JSON");
    }
    return source;
  },
  afterSaveRedirection: '/sources'
}));
})(angular);
