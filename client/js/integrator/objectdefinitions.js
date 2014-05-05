"use strict";
(function(angular) {
angular.module('ObjectDefinitions', ['ngResource', 'mgcrea.ngStrap'])
.config(function($routeProvider, $locationProvider) {
  $routeProvider
  .when('/objectdefinitions', {
    'templateUrl': '/partials/objectdefinitions/overview.html',
    'navItem': 'objectdefinitions'
  })
  .when('/objectdefinitions/create', {
    'templateUrl': '/partials/objectdefinitions/create.html',
    'navItem': 'objectdefinitions'
  })
  .when('/objectdefinitions/edit/:id', {
    'templateUrl': '/partials/objectdefinitions/edit.html',
    'navItem': 'objectdefinitions'
  })
})
.factory('ObjectDefinitions', createBaucisResourceFactory('objectdefinitions'))
.controller('ObjectDefinitionsOverview', createOverviewController({
  resourceName: 'ObjectDefinitions',
  scopeVariable: 'objectDefinitions'
}))
.controller('ObjectDefinitionCreator', createCreatorController({
  resourceName: 'ObjectDefinitions',
  scopeVariable: 'objectDefinition',
  initialValue: {'fields': '[]', 'equality': '[]'},
  transformForSave: function(objDef) {
    var objDef = angular.copy(objDef);
    try {
      objDef.fields = JSON.parse(objDef.fields);
    } catch(e) {
      throw new Error("Field definition must be valid JSON");
    }
    try {
      objDef.equality = JSON.parse(objDef.equality);
    } catch(e) {
      throw new Error("Equality definition must be valid JSON");
    }
    return objDef;
  },
  afterSaveRedirection: '/objectdefinitions'
}))
.controller('ObjectDefinitionEditor', createEditorController({
  resourceName: 'ObjectDefinitions',
  scopeVariable: 'objectDefinition',
  transformOnLoad: function(objDef) {
    var objDef = angular.copy(objDef);
    objDef.fields = JSON.stringify(objDef.fields, null, 4);
    objDef.equality = JSON.stringify(objDef.equality, null, 4);
    return objDef;
  },
  transformForSave: function(objDef) {
    var objDef = angular.copy(objDef);
    try {
      objDef.fields = JSON.parse(objDef.fields);
    } catch(e) {
      throw new Error("Field definition must be valid JSON");
    }
    try {
      objDef.equality = JSON.parse(objDef.equality);
    } catch(e) {
      throw new Error("Equality definition must be valid JSON");
    }
    return objDef;
  },
  afterSaveRedirection: '/objectdefinitions'
}));
})(angular);
