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
.controller('SchemaEditor', ['$scope', function($scope) {
  $scope.schema = {
    'book': {
      'attributes': [
        {
          'name': 'title',
          'type': 'string'
        },
        {
          'name': 'author',
          'type': 'link'
        }
      ]
    },
    'author': {
      'attributes': [
        {
          'name': 'name',
          'type': 'string'
        },
        {
          'name': 'birthyear',
          'type': 'integer'
        }
      ]
    }
  };
  $scope.editEntity = function(a) {
    alert("Editing " + a);
  };
  $scope.createEntity = function() {
    alert("Creating " + $scope.newEntityName);
  };
}]);

