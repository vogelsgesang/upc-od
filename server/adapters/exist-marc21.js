var http = require("http");

var apiEndpoint = "http://localhost:8080/exist/rest//db/od/marc21_search.xq";

var url =  apiEndpoint + "?limit=1";

function callback(res) {
  if(res.statusCode != 200) {
    console.log("unexpected status code " + res.statusCode);
  } else {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log(chunk);
    });
    res.on('end', function(chunk) {
      console.log("\n END OF RESPONSE")
    });
  }
}

var req = http.request(url, callback);
req.on("error", function(e) {
  console.log("error: " + e.message);
});
req.end();
