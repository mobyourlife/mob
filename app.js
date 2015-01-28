/* jslint node: true */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var session = require('express-session');
var Facebook = require('facebook-node-sdk');
var FB = require('fb');

// init the app
var app = express();

// enable cors
var allowCrossDomain = function(req, res, next) {
    if (req.headers.origin) {
        if(req.headers.origin.indexOf('.mobyourlife.com.br') !== -1) { /* DANGER! validate this the right way asap */
            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Origin', req.headers.origin)
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
            next();
        } else {
            console.log("Failed the CORS origin test: ", req.session.username)
            res.send(401, {auth: false});
        }
    } else {
        next();
    }
}

// get db config
var auth = require('./config/auth');
var configDB = require('./config/database');

// connect to database
mongoose.connect(configDB.url);

// setup passport
app.use(cookieParser());
app.use(session({secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessons
app.use(flash()); // use connect-flash messages stored in session

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(Facebook.middleware({ appID: auth.facebookAuth.clientID, secret: auth.facebookAuth.clientSecret }));
app.use(allowCrossDomain);

app.get('/api/login', function(req, res) {
    if(typeof req.user !== 'undefined'){
        res.send({ auth: true, name: req.user.facebook.name });
        // res.send({auth: true, id: req.session.id, username: req.session.username, _csrf: req.session._csrf});
    } else {
        res.status(401).send({ auth: false });
        // res.send(401, {auth: false, _csrf: req.session._csrf});
    }
});

// load passport
require('./config/passport')(passport);

// setup routes
require('./bin/routes')(app, passport, FB); // load our routes and pass in our app fully configured passport

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;