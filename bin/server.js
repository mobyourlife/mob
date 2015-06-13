/* jslint node: true */

var debug = require('debug')('mob');
var app = require('../app');

app.set('port', process.env.PORT || 3000);

var env = app.get('env');
console.log('MOB YOUR LIFE starting...');
console.log('Environment: ' + env);

var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});

/*if (env === 'development') {
    console.log('Starting HTTPS proxy...');
    require('./proxy');
}*/
