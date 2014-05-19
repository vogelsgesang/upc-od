"use strict";
angular.module('odIntegrator', ['Sources', 'ObjectDefinitions', 'ngRoute', 'ngResource', 'ngAnimate', 'mgcrea.ngStrap'])
.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider
  .when('/', {
    'templateUrl': '/partials/home.html',
    'navItem': 'home'
  })
  .when('/data/raw', {
    'templateUrl': '/partials/data/raw-query.html',
    'navItem': 'rawquery'
  })
  .when('/data/consolidated', {
    'templateUrl': '/partials/data/consolidated-query.html',
    'navItem': 'consolidatedquery'
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
    }).error(function(data, statusCode) {
      $scope.error = {
        status: statusCode == 0 ? "offline": statusCode,
        body: data
      };
    });
  }
  $scope.sendQuery = sendQuery;
}])
.controller('ConsolidatedQueryController', ['$scope', '$alert', '$sce', '$http', function($scope, $alert, $sce, $http) {
  $scope.objectType = "";
  $scope.conditions = "[]";
  function sendQuery() {
    delete $scope.error;
    delete $scope.results;
    var objectType = $scope.objectType;
    try {
      var conditions = JSON.parse($scope.conditions);
    } catch(e) {
      $scope.error = "Definition of conditions must be valid JSON";
      return;
    }
    var bodyContent = {
      objectType: objectType,
      conditions: conditions
    };
    $http.post('/api/data/consolidated/query', bodyContent).success(function(data){
      $scope.results = data;
    }).error(function(data, statusCode) {
      $scope.error = {
        status: statusCode == 0 ? "offline": statusCode,
        body: data
      };
    });
  }
  $scope.sendQuery = sendQuery;
}]);
