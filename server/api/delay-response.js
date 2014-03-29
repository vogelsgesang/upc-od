module.exports = function(time) {
  return function(res, req, next) {
    setTimeout(function() {
        next();
    }, time);
  }
}
