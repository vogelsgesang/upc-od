"use strict";
function escapeStringForHtml(string) {
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createBaucisResourceFactory(collectionName) {
  return ['$resource', function($ressource) {
    return $ressource('/api/'+collectionName+'/:_id', {_id: "@_id"}, {
      'save': {method: 'PUT'},
      'create': {method: 'POST'},
      'createBulk': {method: 'POST', isArray: true, transformResponse: function(data, header) {if(typeof data == "object") return [data];}}
    });
  }];
}

/**
 * creates a new controller which displays an overview of a baucis collection
 * It expects a configuration as the first parameter with the following structure:
 * {
 *  'resourceName': the name of the registered factory function for this resource,
 *  'scopeVariable': the name of the variable in the scope under which the data is saved,
 * }
 */
function createOverviewController(config) {
  if(Object.keys(config).indexOf('scopeVariable') < 0) {
    config.scopeVariable = 'entries';
  }
  return ['$document', '$scope', '$sce', '$q', '$alert', config.resourceName, function($document, $scope, $sce, $q, $alert, Resource) {
    function loadEntries() {
      $scope.state = "loading";
      Resource.query(function(entries) {
        $scope[config.scopeVariable] = entries;
        $scope.state = "ready";
      }, function(errMessage) {
        if(errMessage.status == 404) {
          $scope[config.scopeVariable] = [];
          $scope.state = "ready";
        } else {
          $scope.state = "error";
        }
      });
    }
    $scope.reload = loadEntries;
    loadEntries();
    function updateDonwlodLink() {
      $scope.downloadLink = 'data:application/json;charset=utf-8,' + encodeURIComponent(angular.toJson($scope[config.scopeVariable]));
    }
    $scope.updateDownloadLink = updateDonwlodLink;
    $scope.import = {};
    $scope.importFromJson = function importFromJson(fileInputId, replaceOld) {
      var fileInput = $document[0].getElementById(fileInputId);
      if(fileInput.files.length < 1) {
        $alert({title: "Error:", content: $sce.trustAsHtml("Please select a valid JSON file"), type: 'danger'});
      } else {
        $scope.import.working = true;
        var jsonFile = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = function(e) { 
          //parse
          var text = reader['result'];
          try {
            var importedEntries = JSON.parse(text);
          } catch(e) {
            $alert({title: "Error:", content: $sce.trustAsHtml("Please select a valid JSON file"), type: 'danger'});
            $scope.import.working = false;
            return;
          }
          //the success and error callback
          function successCallback() {
            $alert({title: "Success:", content: $sce.trustAsHtml("Successfully imported \""+jsonFile.name+"\""), type: 'success'});//TODO: change message
            $scope.import.working = false;
            loadEntries();
          }
          function errorCallback(response) {
            if(response && response.data && response.data.msg) {
              var msg = escapeStringForHtml(response.data.msg);
            } else {
              var msg = "Unknown error";
            }
            $alert({title: "Unable to import file \""+jsonFile.name+"\"", content: $sce.trustAsHtml(msg), type: 'danger'});
            $scope.import.working = false;
          }
          //dispatch the queries to the server
          if(replaceOld) {
            Resource.delete(function() {
              Resource.createBulk(importedEntries, successCallback, errorCallback);
            }, function(response) {
              if(response.status == 404) Resource.createBulk(importedEntries, successCallback, errorCallback);
              else errorCallback();
            });
          } else {
            Resource.createBulk(importedEntries, successCallback, errorCallback);
          }
        };
        reader.onerror = function(e) {
          $alert({title: "Error:", content: $sce.trustAsHtml("Import: Unable to read the file"), type: 'danger'});
        }
        reader.readAsText(jsonFile);
      }
    }
    $scope.deleting = {};
    $scope.deleteEntry = function(id) {
      $scope.deleting[id] = true;
      Resource.delete({_id: id}, function() {
        $scope[config.scopeVariable] = $scope[config.scopeVariable].filter(function(entry) {
          return entry._id != id;
        });
        delete $scope.deleting[id];
      }, function(response) {
        var severity = "danger";
        if(response && response.data && response.data.msg) {
          var sourceName = '<unknown>';
          for(var i = 0; i < $scope.sources.length; i++) {
            if($scope.sources[i]._id == id) {
              sourceName = $scope.sources[i].name;
              break;
            }
          }
          var msg = escapeStringForHtml(response.data.msg);
          if(response.status == 404) {
            $scope[config['scopeVariable']] = $scope[config['scopeVariable']].filter(function(source) {
              return source._id != id;
            });
            severity = "warning";
          }
        } else {
          var msg = "Unknown error occurred";
        }
        var title = "Failed to delete \"" + sourceName + "\"";
        $alert({title: title, content: $sce.trustAsHtml(msg), type: severity});
        delete $scope.deleting[id];
      });
    };
  }];
}

