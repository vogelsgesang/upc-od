"use strict";
angular.module('Sources', ['ngResource'])
.factory('Sources', ['$resource', function($ressource) {
  return $ressource('/api/sources/:_id', {_id: "@_id"}, {
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'createBulk': {method: 'POST', isArray: true, transformResponse: function(data, header) {if(typeof data == "object") return [data];}}
  });
}])
.controller('SourceOverview', ['$document', '$scope', '$sce', '$q', 'Sources', '$alert', function($document, $scope, $sce, $q, Sources, $alert) {
  function loadSources() {
    $scope.state = "loading";
    Sources.query(function(sources) {
      $scope.sources = sources;
      $scope.state = "ready";
    }, function(errMessage) {
      if(errMessage.status == 404) {
        $scope.sources = [];
        $scope.state = "ready";
      } else {
        $scope.state = "error";
      }
    });
  }
  $scope.reload = loadSources;
  function updateDonwlodLink() {
    $scope.downloadLink = 'data:application/json;charset=utf-8,' + encodeURIComponent(angular.toJson($scope.sources));
  }
  $scope.updateDownloadLink = updateDonwlodLink;
  $scope.deleting = {};
  $scope.sourcesImport = [];
  $scope.sourcesImport.replace = true;
  function importSources() {
    var fileInput = $document[0].getElementById('sourcesImportFile');
    if(fileInput.files.length < 1) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Please select a valid JSON file"), type: 'danger'});
    } else {
      $scope.sourcesImport.working = true;
      var reader = new FileReader();
      reader.onload = function(e) { 
        //parse
        var text = reader['result'];
        try {
          var importedSources = JSON.parse(text);
        } catch(e) {
          $alert({title: "Error:", content: $sce.trustAsHtml("Please select a valid JSON file"), type: 'danger'});
          $scope.sourcesImport.working = false;
          return;
        }
        if(!importedSources instanceof Array) {
          $alert({title: "Error:", content: $sce.trustAsHtml("The specified file does not contain valid source definitions"), type: 'danger'});
          $scope.sourcesImport.working = false;
          return;
        }
        //the success and error callback
        function successCallback() {
          $alert({title: "Success:", content: $sce.trustAsHtml("Sources were imported successfully"), type: 'success'});
          $scope.sourcesImport.working = false;
          loadSources();
        }
        function errorCallback(response) {
          if(response && response.data && response.data.msg) {
            var msg = response.data.msg
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
          } else {
            var msg = "Unknown error";
          }
          $alert({title: "Unable to import ressources", content: $sce.trustAsHtml(msg), type: 'danger'});
          $scope.sourcesImport.working = false;
        }
        //dispatch the queries to the server
        if($scope.sourcesImport.replace) {
          Sources.delete(function() {
            Sources.createBulk(importedSources, successCallback, errorCallback);
          }, function(response) {
            if(response.status == 404) Sources.createBulk(importedSources, successCallback, errorCallback);
            else errorCallback();
          });
        } else {
          Sources.createBulk(importedSources, successCallback, errorCallback);
        }
      };
      reader.onerror = function(e) {
        $alert({title: "Error:", content: $sce.trustAsHtml("Unable to read the file"), type: 'danger'});
      }
      reader.readAsText(fileInput.files[0]);
    }
  }
  $scope['sourcesImport']['import'] = importSources;
  $scope.deleteSource = function(id) {
    $scope.deleting[id] = true;
    Sources.delete({_id: id}, function() {
      $scope.sources = $scope.sources.filter(function(source) {
        return source._id != id;
      });
      delete $scope.deleting[id];
    }, function(response) {
      var severity = "danger";
      if(response && response.data && response.data.msg) {
        if(response.status == 404) {
          $scope.sources = $scope.sources.filter(function(source) {
            return source._id != id;
          });
          severity = "warning";
        }
        var sourceName = '<unknown>';
        for(var i = 0; i < $scope.sources.length; i++) {
          if($scope.sources[i]._id == id) {
            sourceName = $scope.sources[i].name;
            break;
          }
        }
        var msg = response.data.msg
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      } else {
        var msg = "Unknown error occurred";
      }
      var title = "Failed to delete source " + sourceName;
      $alert({title: title, content: $sce.trustAsHtml(msg), type: severity});
      delete $scope.deleting[id];
    });
  };
  loadSources();
}])
.controller('SourceCreator', ['$scope', '$alert', '$sce', '$location', 'Sources', function($scope, $alert, $sce, $location, Sources) {
  $scope.source = {};
  $scope.source.adapter = {};
  $scope.source.adapter.config = "{\n}";
  $scope.source.mapping = "[\n]";
  $scope.save = function() {
    $scope.saving = true;
    try {
      var config = JSON.parse($scope.source.adapter.config);
    } catch(e) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Adapter configuration of the source must be valid JSON"), type: 'danger'});
      $scope.saving = false;
      return;
    }
    try {
      var mapping = JSON.parse($scope.source.mapping);
    } catch(e) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Mapping must be valid JSON"), type: 'danger'});
      $scope.saving = false;
      return;
    }
    var sourceObject = {
      name: $scope.source.name,
      adapter: {
        name: $scope.source.adapter.name,
        config: config
      },
      mapping: mapping
    }
    Sources.create(sourceObject, function() {
      $scope.saving = false;
      $location.path("/sources");
    }, function(response) {
      if(response && response.data && response.data.msg) {
        var msg = response.data.msg
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
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
    try {
      var config = JSON.parse($scope.source.adapter.config);
    } catch(e) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Adapter configuration of the source must be valid JSON"), type: 'danger'});
      $scope.saving = false;
      return;
    }
    try {
      var mapping = JSON.parse($scope.source.mapping);
    } catch(e) {
      $alert({title: "Error:", content: $sce.trustAsHtml("Mapping must be valid JSON"), type: 'danger'});
      $scope.saving = false;
      return;
    }
    var sourceObject = {
      _id: $routeParams.id,
      name: $scope.source.name,
      adapter: {
        name: $scope.source.adapter.name,
        config: config
      },
      mapping: mapping
    }
    Sources.save(sourceObject, function() {
      $scope.saving = false;
      $location.path("/sources");
    }, function(response) {
      if(response && response.data && response.data.msg) {
        var msg = response.data.msg
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      } else {
        msg = "Unknown error";
      }
      $alert({title: "Failed to save source", content: $sce.trustAsHtml(msg), type: 'danger'});
      $scope.saving = false;
    });
  };
}]);
