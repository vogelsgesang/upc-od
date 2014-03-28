"use strict";

var RoutesRouter = require("routes");
var url = require("url");

module.exports = Router;

function Router(options) {
  if(options === undefined) options = {};
  var unknownRoute = options.unknownRoute || defaultUnknownRoute;
  var unknownMethod = options.unknownMethod || defaultUnknownMethod;
  var baseUrl = options.baseUrl || "";

  var router = new RoutesRouter();

  function handleRequest(req, res, parentOpts) {
    var route = router.match(url.parse(req.url).pathname)

    if (!route) {
      res.statusCode = 404;
      return unknownRoute(req, res, parentOpts);
    }

    var opts = {
      params: route.params,
      splats: route.splats
    };

    if(parentOpts !== undefined) {
      for(key in Object.keys(parentOpts.params)) {
        if(!opts.params.hasOwnProperty(key)) {
          opts.params[key] = parentOpts.params[key];
        }
      }
      opts.splats = parentOpts.splats.concat(opts.splats);
    }
    return route.fn(req, res, opts);
  }

  handleRequest.addRoute = function(uri, fn) {
    if (typeof fn === "object") {
      fn = wrapMethodSelector(fn, unknownMethod);
    }
    router.addRoute(uri, fn);
    return this;
  };
  handleRequest.addChildRouter = function(uri, childRouter) {
    if(uri[uri.length - 1] != '/') {
      uri += "(?:/*)?";
    } else {
      uri += "*?";
    }
    var wrappedRouter = wrapChildRouter(childRouter);
    router.addRoute(uri, wrappedRouter);
    return this;
  }

  return handleRequest;
}

function wrapMethodSelector(routes, unknownRouteCallback) {
  function handleUnknownRoute(req, res) {
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

function wrapChildRouter(router) {
  return function childRouter(req, res, opts) {
    var remainingUrl = opts.splats.pop();
    if(remainingUrl == undefined) remainingUrl = "/";
    remainingUrl = "/" + remainingUrl;
    req.url = remainingUrl;
    router(req, res, opts);
  }
}

function defaultUnknownRoute(req, res) {
  res.statusCode = 404;
  res.write("404 Not found");
  res.end();
}

function defaultUnknownMethod(req, res) {
  res.statusCode = 405;
  res.write("405 Method not allowed");
  res.end();
}
