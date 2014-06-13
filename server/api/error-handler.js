module.exports = function handleApiError(err, req, res, next) {
  if(!err) return next();
  var statusCode = res.statusCode;
  if(statusCode >= 200 && statusCode <= 400) {
    statusCode = 500;
  }
  if(err.status!== undefined) {
    statusCode = err.status;
  }
  if(err.statusCode !== undefined) {
    statusCode = err.statusCode;
  }
  var response = {msg: "An error occurred"}
  if(err.message !== undefined) {
    response.msg = err.message;
  }
  if(err.stack) {
    response.stack = err.stack;
  }
  res.statusCode = statusCode;
  res.json(response);
}
