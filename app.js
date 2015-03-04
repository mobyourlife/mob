/* jslint node: true */

var express = require('express');
var expressValidator = require('express-validator');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var Facebook = require('facebook-node-sdk');
var FB = require('fb');
var SignedRequest = require('facebook-signed-request');
var URL = require('url-parse');
var Domain = require('./models/domain');

// init the app
var app = express();

// enable cors
var allowCrossDomain = function(req, res, next) {
    var allowed = ['s-static.ak.facebook.com'];
    var current = new URL(req.url);
    
    if (current.pathname === '/realtime') {
        console.log('Aceitando realtime updates!');
        console.log('current:');
        console.log(current);
        console.log('origin:');
        console.log(req.headers.origin);
        console.log('---');
        next();
    } else {
        if (req.headers.origin) {
            var parsed = new URL(req.headers.origin);
        }

        if (!req.headers.origin || (parsed && allowed.indexOf(parsed.hostname) != -1)) {
            next();
        } else {
            Domain.findOne({ '_id': parsed.hostname }, function(err, found) {
                if (found) {
                    res.header('Access-Control-Allow-Credentials', true);
                    res.header('Access-Control-Allow-Origin', req.headers.origin)
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
                    next();
                } else {
                    res.status(401).send({ auth: false });
                }
            });
        }
    }
}

// get db config
var auth = require('./config/auth');
var configDB = require('./config/database');

// connect to database
mongoose.connect(configDB.url);

// setup route middlewares
var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false });

// setup passport
app.use(cookieParser());
app.use(session({ secret: 'ilovescotchscotchyscotchscotch', store: new MongoStore({ mongooseConnection: mongoose.connection })})); // session secret and store
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
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(Facebook.middleware({ appID: auth.facebookAuth.clientID, secret: auth.facebookAuth.clientSecret }));
app.use(allowCrossDomain);

// load passport
require('./config/passport')(passport);

// setup signed request
SignedRequest.secret = auth.facebookAuth.clientSecret;

// setup routes
require('./bin/routes')(app, passport, FB, SignedRequest, csrfProtection, parseForm); // load our routes and pass in our app fully configured passport

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