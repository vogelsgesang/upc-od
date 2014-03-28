angular.module('odIntegrator', ['ngRoute'])
.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider
  .when('/', {
    'templateUrl': 'partials/home.html',
    'navItem': 'home'
  })
  .when('/schema', {
    'templateUrl': 'partials/schema-overview.html',
    'navItem': 'schema'
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
}]);

