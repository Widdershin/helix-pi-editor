var express = require('express');
var app = express();

app.use(express.static('editor'));
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/editor/index.html');
});

var port = process.env.PORT || 3000;

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Helix Pi Editor listening at http://%s:%s', host, port);
});
