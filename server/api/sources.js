"use strict";
var Router = require("./router");
var sendJson = require("send-data/json");
var connect = require("connect");
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;

var sourcesCollection = null;
MongoClient.connect('mongodb://127.0.0.1:27017/od-project', function(err, db) {
  if(err !== null) {
    console.log(err);
  } else {
    db.collection('sources', function(err, collection) {
      if(err !== null) {
        console.log(err);
      } else {
        console.log("Mongo ready.");
        sourcesCollection = collection
      }
    });
  }
});

function sourcesIndex(req, res, next) {
  sourcesCollection.find({}).toArray(function(err, items) {
    if(err !== null) {
      return next(err);
    }
    sendJson(req, res, items);
  });
}

function replaceAllSources(req, res, next) {
  sourcesCollection.remove({}, function(err, result) {
    if(err !== null) {
      return next(err);
    }
    sourcesCollection.insert(req.body, function(err, result) {
      if(err !== null) {
        return next(err);
      }
      sendJson(req, res, {});
    });
  });
}

function createSource(req, res, next) {
  if(req.body instanceof Array) {
    return next(new Error("JSON object expected (got an array)"));
  }
  sourcesCollection.insert(req.body, function(err, result) {
    if(err !== null) {
      return next(err);
    }
    res.statusCode = 201;
    sendJson(req, res, {"new_id": result[0]['_id']});
  });
}

function deleteAllSources(req, res, next) {
  sourcesCollection.remove({}, function(err, result) {
    if(err !== null) {
      next(err);
    } else {
      sendJson(req, res, {});
    }
  });
}

function getSource(req, res, next) {
  try {
    var objId = mongo.ObjectID(req.params.id);
  } catch(e) {
    var err = new Error("invalid object id");
    err.statusCode = 400;
    return next(err);
  }
  sourcesCollection.find({_id: objId}).toArray(function(err, items) {
    if(items.length == 0) {
      err = new Error("source not found");
      err.statusCode= 404;
    }
    if(items.length > 1) {
      err = new Error("id not unique");
      err.statusCode= 500;
    }
    if(err !== null) {
      return next(err);
    }
    sendJson(req, res, items[0]);
  });
}

function updateSource(req, res, next) {
  try {
    var objId = mongo.ObjectID(req.params.id);
  } catch(e) {
    var err = new Error("invalid object id");
    err.statusCode = 400;
    return next(err);
  }
  sourcesCollection.update({_id: objId}, req.body, function(err, result) {
    if(err) {
      return next(err);
    }
    sendJson(req, res, {});
  })
}

function deleteSource(req, res, next) {
  try {
    var objId = mongo.ObjectID(req.params.id);
  } catch(e) {
    var err = new Error("invalid object id");
    err.statusCode = 400;
    return next(err);
  }
  sourcesCollection.remove({}, function(err, result) {
    if(err !== null) {
      next(err);
    } else {
      sendJson(req, res, {});
    }
  });
}

var sourcesRouter = Router()
  .addRoute('/', {
    GET: sourcesIndex,
    PUT: replaceAllSources,
    POST: createSource,
    DELETE: deleteAllSources
  })
  .addRoute('/:id', {
    GET: getSource,
    PUT: updateSource,
    DELETE: deleteSource
  })

module.exports = sourcesRouter;
