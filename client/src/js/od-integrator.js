angular.module('odIntegrator', ['ngRoute', 'ngResource'])
.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider
  .when('/', {
    'templateUrl': '/partials/home.html',
    'navItem': 'home'
  })
  .when('/schema', {
    'templateUrl': '/partials/schema-overview.html',
    'navItem': 'schema'
  })
  .when('/sources', {
    'templateUrl': '/partials/sources-overview.html',
    'navItem': 'sources'
  })
  .when('/sources/create', {
    'templateUrl': '/partials/sources-create.html',
    'navItem': 'sources'
  })
  .when('/sources/edit/:id', {
    'templateUrl': '/partials/sources-edit.html',
    'navItem': 'sources'
  })
  .otherwise({
    'redirectTo': '/'
  });
})
.controller('Navigation', ['$scope', '$route', function($scope, $route) {
  $scope.$on("$routeChangeSuccess", function(evt, routeData) {
    $scope.navItem = $route.current.navItem;
  });
}])
.controller('SchemaEditor', ['$scope', '$http', function($scope, $http) {
  $http({method:'GET', url:'/api/schema'}).success(function(data, statusCode) {
    $scope.schema = data;
  }).error(function(data, statusCode) {
    alert("Unable to fetch schema");
  });
  $scope.editEntity = function(a) {
    alert("Editing " + a);
  };
  $scope.createEntity = function() {
    alert("Creating " + $scope.newEntityName);
  };
}])
.factory('Sources', ['$resource', function($ressource) {
   return $ressource('/api/sources/:_id', {_id: "@_id"});
}])
.controller('SourcesOverview', ['$scope', '$http', 'Sources', function($scope, $http, Sources) {
  function loadSources() {
    $scope.state = "loading";
    Sources.query(function(sources) {
      $scope.sources = sources;
      $scope.state = "loaded";
    }, function(errMessage) {
      $scope.state = "error";
    });
  }
  $scope.reload = loadSources;
  $scope.deleting = {};
  $scope.deleteSource = function(id) {
    $scope.deleting[id] = true;
    Sources.delete({_id: id}, function() {
      delete $scope.deleting[id];
      loadSources();
    }, function() {
      delete $scope.deleting[id];
      alert("failed to delete source");
    });
  };
  loadSources();
}]);
