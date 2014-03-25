function handleApiCall(request, response) {
  //Since we do not have an api so far, just answer with an error
  response.writeHead(404, {});
  response.write("Not implemented.");
  response.end();
}

exports.handle = handleApiCall;
