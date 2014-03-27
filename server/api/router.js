"use strict";

var RoutesRouter = require("routes");
var url = require("url");

module.exports = Router;

function Router(options) {
  if(options === undefined) options = {};
  var unknownRoute = options.unknownRoute || defaultUnknownRoute;
  var baseUrl = options.baseUrl || "";

  var router = new RoutesRouter();

  function handleRequest(req, res, parentOpts) {
    var route = router.match(url.parse(req.url).pathname)

    if (!route) {
      return unknownRoute(req, res, parentOpts);
    }

    var opts = {
      params: route.params,
      splats: route.splats
    };

    console.log(parentOpts);
    if(parentOpts !== undefined) {
      for(key in Object.keys(parentOpts.params)) {
        if(!opts.params.hasOwnProperty(key)) {
          opts.params[key] = parentOpts.params[key];
        }
      }
      opts.splats = parentOpts.splats.concat(opts.splats);
    }
    console.log(opts);

    route.fn(req, res, opts);
  }

  handleRequest.addRoute = function(uri, fn) {
    if (typeof fn === "object") {
      fn = methodSelector(fn, unknownRoute);
    }
    router.addRoute(uri, fn);
    return this;
  };
  handleRequest.addChildRouter = function(uri, childRouter) {
    if(uri[uri.length - 1] != '/') {
      uri += "/";
    }
    uri += "*";
    var wrappedRouter = wrapChildRouter(childRouter);
    router.addRoute(uri, wrappedRouter);
    return this;
  }

  return handleRequest;
}

function wrapMethodSelector(routes, notFound) {
  return function selectByMethod(req) {
    var method = req.method;
    var f = routes[method] || notFound;
    return f.apply(this, arguments)
  }
}

function wrapChildRouter(router) {
  return function childRouter(req, res, opts) {
    var remainingUrl = "/" + opts.splats.pop();
    req.url = remainingUrl;
    router(req, res, opts);
  }
}

function defaultUnknownRoute(req, res) {
  res.statusCode = 404;
  res.write("Not found");
  res.end();
}
