"use strict";
angular.module('odIntegrator', ['Sources', 'ngRoute', 'ngResource', 'ngAnimate', 'mgcrea.ngStrap'])
.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider
  .when('/', {
    'templateUrl': '/partials/home.html',
    'navItem': 'home'
  })
  .when('/objectdefinitions', {
    'templateUrl': '/partials/object-definitions/overview.html',
    'navItem': 'objectdefinitions'
  })
  .when('/sources', {
    'templateUrl': '/partials/sources/overview.html',
    'navItem': 'sources'
  })
  .when('/sources/create', {
    'templateUrl': '/partials/sources/create.html',
    'navItem': 'sources'
  })
  .when('/sources/edit/:id', {
    'templateUrl': '/partials/sources/edit.html',
    'navItem': 'sources'
  })
  .when('/data/raw', {
    'templateUrl': '/partials/data/raw-query.html',
    'navItem': 'rawquery'
  })
  .otherwise({
    'redirectTo': '/'
  });
})
.config(['$compileProvider', function($compileProvider){
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data):/);
}])
.config(['$alertProvider', function($alertProvider) {
  angular.extend($alertProvider.defaults, {
    animation: 'am-fade-and-slide-top',
    container: '#alert-container',
    duration: 5
  });
}])
.directive('staticInclude', ['$http', '$templateCache', '$compile', function($http, $templateCache, $compile) {
  return function(scope, element, attrs) {
    var templatePath = attrs.staticInclude;
    $http.get(templatePath, {cache: $templateCache}).success(function(response) {
      element.html(response);
      $compile(element.contents())(scope);
    });
  };
}])
.controller('Navigation', ['$scope', '$route', function($scope, $route) {
  $scope.$on("$routeChangeSuccess", function(evt, routeData) {
    $scope.navItem = $route.current.navItem;
  });
}])
.controller('RawQueryController', ['$scope', '$alert', '$sce', '$http', '$routeParams', function($scope, $alert, $sce, $http, $routeParams) {
  if("sourceId" in $routeParams) {
    $scope.sourceId = $routeParams["sourceId"];
  }
  $scope.objectType = "";
  $scope.conditions = "[]";
  $scope.fields = "[]";
  function sendQuery() {
    delete $scope.error;
    delete $scope.results;
    var sourceId = $scope.sourceId;
    if(!/^[0-9a-f]{24}$/.test(sourceId)) {
      $scope.error = "Invalid format of source id";
      return;
    }
    var objectType = $scope.objectType;
    try {
      var conditions = JSON.parse($scope.conditions);
    } catch(e) {
      $scope.error = "Definition of conditions must be valid JSON";
      return;
    }
    try {
      var fields = JSON.parse($scope.fields);
    } catch(e) {
      $scope.error = "Definition of fields must be valid JSON";
      return;
    }
    var bodyContent = {
      objectType: objectType,
      conditions: conditions,
      fields: fields
    };
    $http.post('/api/data/raw/'+sourceId+'/query', bodyContent).success(function(data){
      $scope.results = data;
    }).error(function(data) {
      $scope.error = data;
    });
  }
  $scope.sendQuery = sendQuery;
}]);
