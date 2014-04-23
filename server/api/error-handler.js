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
  var message = "An error occured";
  if(err.message !== undefined) {
    message = err.message;
  }
  res.statusCode = statusCode;
  res.json({
    msg: message
  });
}
