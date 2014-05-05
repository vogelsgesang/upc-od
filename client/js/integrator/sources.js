"use strict";
(function(angular) {
function escapeStringForHtml(string) {
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

angular.module('Sources', ['ngResource'])
.factory('Sources', createBaucisResourceFactory('sources'))
.controller('SourceOverview', createOverviewController({
  resourceName: 'Sources',
  scopeVariable: 'sources'
}))
.controller('SourceCreator', ['$scope', '$alert', '$sce', '$location', 'Sources', function($scope, $alert, $sce, $location, Sources) {
  $scope.source = {};
  $scope.source.adapter = {};
  $scope.source.adapter.config = "{\n}";
  $scope.source.mapping = "[\n]";
  $scope.save = function() {
    $scope.saving = true;
    var sourceObject = angular.copy($scope.source);
    try {
      sourceObject.adapter.config = JSON.parse(sourceObject.adapter.config);
    } catch(e) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Adapter configuration of the source must be valid JSON"), type: 'danger'});
      $scope.saving = false;
      return;
    }
    try {
      sourceObject.mapping = JSON.parse(sourceObject.mapping);
    } catch(e) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Mapping must be valid JSON"), type: 'danger'});
      $scope.saving = false;
      return;
    }
    Sources.create(sourceObject, function() {
      $scope.saving = false;
      $location.path("/sources");
    }, function(response) {
      if(response && response.data && response.data.msg) {
        var msg = escapeStringForHtml(response.data.msg);
      } else {
        msg = "Unknown error occured";
      }
      $alert({title: "Failed to save source", content: $sce.trustAsHtml(msg), type: 'danger'});
      $scope.saving = false;
    });
  };
}])
.controller('SourceEditor', ['$scope', '$alert', '$sce', '$location', '$routeParams', 'Sources', function($scope, $alert, $sce, $location, $routeParams, Sources) {
  $scope.state = 'loading';
  function loadSource() {
    Sources.get({_id: $routeParams.id}, function(source) {
      if(source.adapter.config === undefined) {
        source.adapter.config = {};
      }
      $scope.source = source;
      $scope.state = 'ready';
      $scope.source.adapter.config = JSON.stringify(source.adapter.config, null, 4);
      $scope.source.mapping = JSON.stringify(source.mapping, null, 4);
    }, function(result) {
      $scope.state = 'error'
    });
  }
  $scope.load = loadSource;
  loadSource();
  $scope.save = function() {
    $scope.saving = true;
    var sourceObject = angular.copy($scope.source);
    try {
      sourceObject.adapter.config = JSON.parse(sourceObject.adapter.config);
    } catch(e) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Adapter configuration of the source must be valid JSON"), type: 'danger'});
      $scope.saving = false;
      return;
    }
    try {
      sourceObject.mapping = JSON.parse(sourceObject.mapping);
    } catch(e) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Mapping must be valid JSON"), type: 'danger'});
      $scope.saving = false;
      return;
    }
    Sources.save(sourceObject, function() {
      $scope.saving = false;
      $location.path("/sources");
    }, function(response) {
      if(response && response.data && response.data.msg) {
        var msg = escapeStringForHtml(response.data.msg);
      } else {
        msg = "Unknown error";
      }
      $alert({title: "Failed to save source", content: $sce.trustAsHtml(msg), type: 'danger'});
      $scope.saving = false;
    });
  };
}]);
})(angular);
