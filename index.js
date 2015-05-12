var express = require('express');
var app = express();

app.use(express.static('editor'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/editor/index.html');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Helix Pi Editor listening at http://%s:%s', host, port);
});
