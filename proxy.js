var fs = require('fs'),
  http = require('http'),
  https = require('https'),
  httpProxy = require('http-proxy');

var isHttps = true; // do you want a https proxy?

var options = {
  https: {
    key: fs.readFileSync('cert.key'),
    cert: fs.readFileSync('cert.pem')
  }
};

// this is the target server
var proxy = httpProxy.createProxyServer({
  target: {
    host: '127.0.0.1',
    port: 80
  }
});

if (isHttps)
  https.createServer(options.https, function(req, res) {
    console.log('Proxying HTTPS request at %s', new Date());
    proxy.proxyRequest(req, res);
  }).listen(443, function(err) {
    if (err)
      console.log('Error serving HTTPS proxy request: %s', req);

    console.log('Created HTTPS proxy successfully.');
  });
else
  http.createServer(options.https, function(req, res) {
    console.log('Proxying HTTP request at %s', new Date());
    console.log(req);
    proxy.proxyRequest(req, res);
  }).listen(80, function(err) {
    if (err)
      console.log('Error serving HTTP proxy request: %s', req);

    console.log('Created HTTP proxy successfully.');
  });

require('./bin/server');
