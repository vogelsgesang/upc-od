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
      'createBulk': {
        method: 'POST', isArray: true,
        transformResponse: function(data, header) {
          try {
            var parsed = JSON.parse(data);
            if(parsed instanceof Array) return parsed;
            else return [parsed];
          } catch(e) {
            return data;
          }
        }
      }
    });
  }];
}

/**
 * creates a new controller which displays an overview of a baucis collection.
 * It expects a configuration as the first parameter with the following structure:
 * {
 *  'resourceName': the name of the factory function for this resource,
 *  'scopeVariable': the name of the variable in the scope under which the data is saved,
 * }
 */
function createOverviewController(config) {
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
          if(!(importedEntries instanceof Array)) {
            importedEntries = [importedEntries];
          }
          //the success and error callback
          function successCallback() {
            $alert({title: "Success:", content: $sce.trustAsHtml("Successfully imported \""+jsonFile.name+"\""), type: 'success'});//TODO: change message
            $scope.import.working = false;
            loadEntries();
          }
          function errorCallback(response) {
            if(response && response.data && response.data instanceof Array && response.data[0].msg) {
              var msg = escapeStringForHtml(response.data[0].msg);
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
          var instanceName = '<unknown>';
          for(var i = 0; i < $scope[config.scopeVariable].length; i++) {
            if($scope[config.scopeVariable][i]._id == id) {
              instanceName = $scope[config.scopeVariable][i].name;
              break;
            }
          }
          var msg = escapeStringForHtml(response.data.msg);
          if(response.status == 404) {
            $scope[config.scopeVariable] = $scope[config.scopeVariable].filter(function(source) {
              return source._id != id;
            });
            severity = "warning";
          }
        } else {
          var msg = "Unknown error occurred";
        }
        var title = "Failed to delete \"" + instanceName + "\"";
        $alert({title: title, content: $sce.trustAsHtml(msg), type: severity});
        delete $scope.deleting[id];
      });
    };
  }];
}

/**
 * creates a new controller for creating a new entry and storing it into a baucis collection.
 * The first parameter is a configuration with the following structure:
 * {
 *  'resourceName': the name of the factory function for this resource,
 *  'scopeVariable': the name of the variable in the scope under which the data is saved,
 *  'initialValue': the initial value/the default values,
 *  'transformForSave': this function is called before saving (1. param: the element to be saved)
 *                      and the return value of it will be saved using baucis,
 *  'afterSaveRedirection': the name of the site where the user should be forwarded to after
 *                          the new entry was successfully saved
 * }
 */
function createCreatorController(config) {
  return ['$scope', '$alert', '$sce', '$location', config.resourceName, function($scope, $alert, $sce, $location, Resource) {
    $scope[config.scopeVariable] = config.initialValue;
    $scope.save = function() {
      $scope.saving = true;
      try {
        var newObject = config.transformForSave(angular.copy($scope[config.scopeVariable]));
      } catch(e) {
        $alert({title: 'Error:', content: $sce.trustAsHtml(e.message), type: 'danger'});
        $scope.saving = false;
        return;
      }
      Resource.create(newObject, function() {
        $scope.saving = false;
        $location.path(config.afterSaveRedirection);
      }, function(response) {
        if(response && response.data && response.data.msg) {
          var msg = escapeStringForHtml(response.data.msg);
        } else {
          msg = "Unknown error occured";
        }
        $alert({title: "Unable to save:", content: $sce.trustAsHtml(msg), type: 'danger'});
        $scope.saving = false;
      });
    };
  }];
}

/**
 * creates a new controller which displays an overview of a baucis collection.
 * The first parameter is a configuration with the following structure:
 * {
 *  'resourceName': the name of the factory function for this resource,
 *  'scopeVariable': the name of the variable in the scope under which the data is saved,
 *  'transformOnLoad': this function is called after loading the entry (1. param: the loaded entry)
 *                     and the return value of it will be saved using baucis,
 *  'transformForSave': this function is called before saving (1. param: the element to be saved)
 *                      and the return value of it will be saved using baucis,
 *  'afterSaveRedirection': the name of the site where the user should be forwarded to after
 *                          the new entry was successfully saved
 * }
 */
function createEditorController(config) {
  return ['$scope', '$alert', '$sce', '$location', '$routeParams', config.resourceName, function($scope, $alert, $sce, $location, $routeParams, Resource) {
    function loadSource() {
      $scope.state = 'loading';
      Resource.get({_id: $routeParams.id}, function(entry) {
        $scope[config.scopeVariable] = config.transformOnLoad(entry);
        $scope.state = 'ready';
      }, function(result) {
        $scope.state = 'error'
      });
    }
    $scope.load = loadSource;
    loadSource();
    $scope.save = function() {
      $scope.saving = true;
      try {
        var newValues = config.transformForSave(angular.copy($scope[config.scopeVariable]));
      } catch(e) {
        $alert({title: 'Error:', content: $sce.trustAsHtml(e.message), type: 'danger'});
        $scope.saving = false;
        return;
      }
      Resource.save(newValues, function() {
        $scope.saving = false;
        $location.path(config.afterSaveRedirection);
      }, function(response) {
        if(response && response.data && response.data.msg) {
          var msg = escapeStringForHtml(response.data.msg);
        } else {
          msg = "Unknown error";
        }
        $alert({title: "Unable to save:", content: $sce.trustAsHtml(msg), type: 'danger'});
        $scope.saving = false;
      });
    };
  }];
}
