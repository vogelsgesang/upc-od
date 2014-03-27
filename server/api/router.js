"use strict";

var RoutesRouter = require("routes");
var url = require("url");
var extend = require("xtend");

module.exports = Router;

function Router(options) {
  var unknownRoute = options.unknownRoute || defaultUnknownRoute;
  var baseUrl = options.baseUrl || "";

  var router = new RoutesRouter();

  function handleRequest(req, res, parentOpts) {
    var route = router.match(url.parse(req.url).pathname)

    if (!route) {
      return unknownRoute(req, res, parentOpts);
    }

    var opts = extend(parentOpts,{
      params: route.params,
      splats: route.splats
    });

    route.fn(req, res, opts);
  }

  handleRequest.addRoute = function(uri, fn) {
    if (typeof fn === "object") {
      fn = methodSelector(fn, unknownRoute);
    }

    router.addRoute(uri, fn);
    return this;
  };

  return handleRequest;
}

function methodSelector(routes, notFound) {
  return function selectByMethod(req) {
    var method = req.method;
    var f = routes[method] || notFound;
    return f.apply(this, arguments)
  }
}

function defaultUnknownRoute(req, res) {
  res.statusCode = 404;
  res.write("Not found");
  res.end();
}
