"use strict";

var RoutesRouter = require("routes");
var url = require("url");

module.exports = Router;

function Router() {
  //this router is used in order to parse the urls
  var router = new RoutesRouter();

  //handleRequest handles the actual requests and will be returned by this function
  var handleRequest = function (req, res, next) {
    var route = router.match(url.parse(req.url).pathname)

    if (!route) {
      res.statusCode = 404;
      var error = new Error("Unknown route");
      error.code = 404;
      next(error);
    }

    if(!res.hasOwnProperty('params')) {
      req.params = {};
    }
    for(var key in route.params) {
      if(route.params.hasOwnProperty(key)) {
        req.params[key] = route.params[key];
      }
    }
    if(!res.hasOwnProperty('splats')) {
      req.splats = [];
    }
    req.splats = req.splats.concat(route.splats);

    route.fn(req, res, next);
  }
  //expose a possibility to add routes
  handleRequest.addRoute = function(uri, fn) {
    if (typeof fn === "object") {
      fn = wrapMethodSelector(fn);
    }
    router.addRoute(uri, fn);
    return this;
  };
  //expose a possibility to add other routers as sub routers
  handleRequest.addChildRouter = function(uri, childRouter) {
    if(uri[uri.length - 1] != '/') {
      uri += "(?:/*)?";
    } else {
      uri += "*?";
    }
    var wrappedRouter = wrapChildRouter(childRouter);
    router.addRoute(uri, wrappedRouter);
    return this;
  };

  return handleRequest;
}

//handles the selection of a function based on the HTTP method
function wrapMethodSelector(routes) {
  function handleUnknownMethod(req, res, next) {
    var error = new Error("Method not allowed");
    error.code = 405;
    error.acceptedMethods = Object.keys(routes);
    next(error);
  }
  return function selectByMethod(req) {
    var method = req.method;
    var f = routes[method] || handleUnknownMethod;
    return f.apply(this, arguments)
  }
}

//returns a wrapped child router which is able to handle the urls correctly
function wrapChildRouter(router) {
  return function adjustUrlForChildRouter(req, res, next) {
    var remainingUrl = req.splats.pop();
    if(remainingUrl == undefined) remainingUrl = "/";
    remainingUrl = "/" + remainingUrl;
    req.url = remainingUrl;
    router(req, res, next);
  }
}
