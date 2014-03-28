"use strict";

var RoutesRouter = require("routes");
var url = require("url");

module.exports = Router;

function Router(options) {
  //interpret the options
  if(options === undefined) options = {};
  var unknownRoute = options.unknownRoute || defaultUnknownRoute;
  var unknownMethod = options.unknownMethod || defaultUnknownMethod;
  var baseUrl = options.baseUrl || "";

  //this router is used in order to parse the urls
  var router = new RoutesRouter();

  //handleRequest handles the actual requests and will be returned by this function
  var handleRequest = function (req, res, next) {
    var route = router.match(url.parse(req.url).pathname)

    if (!route) {
      res.statusCode = 404;
      return handleRequest.unknownRoute(req, res, next);
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

    return route.fn(req, res, next);
  }
  //set the error handlers
  handleRequest.unknownMethod = unknownMethod;
  handleRequest.unknownRoute = unknownRoute;
  //expose a possibility to add routes
  handleRequest.addRoute = function(uri, fn) {
    if (typeof fn === "object") {
      fn = wrapMethodSelector(fn, handleRequest.unknownMethod);
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
    if(childRouter.unknownRoute === defaultUnknownRoute) {
      childRouter.unknownRoute = handleRequest.unknownRoute;
    }
    if(childRouter.unknownMethod === defaultUnknownMethod) {
      childRouter.unknownMethod = handleRequest.unknownMethod;
    }
    var wrappedRouter = wrapChildRouter(childRouter);
    router.addRoute(uri, wrappedRouter);
    return this;
  };

  return handleRequest;
}

//handles the selection of a function based on the HTTP method
function wrapMethodSelector(routes, unknownRouteCallback) {
  function handleUnknownRoute(req, res, next) {
    res.statusCode = 405;
    var acceptedMethods = Object.keys(routes);
    res.setHeader("Accept", acceptedMethods.join(', '));
    return unknownRouteCallback.apply(this, arguments);
  }
  return function selectByMethod(req) {
    var method = req.method;
    var f = routes[method] || handleUnknownRoute;
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

function defaultUnknownRoute(req, res, next) {
  res.statusCode = 404;
  res.write("404 Not found");
  res.end();
  next();
}

function defaultUnknownMethod(req, res, next) {
  res.statusCode = 405;
  res.write("405 Method not allowed");
  res.end();
  next();
}
