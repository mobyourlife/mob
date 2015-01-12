/* jslint node: true */

var mongoose = require('mongoose');
var FB = require('fb');

// load models
var Fanpage = require('./models/fanpage');
var Owner = require('./models/owner');

// get db config
var auth = require('./config/auth');
var configDB = require('./config/database');

// connect to database
mongoose.connect(configDB.url);

// app loop
var sync = function() {
    console.log('Running Sync');
    
    Fanpage.find({}, function(err, foundFanpages) {
        foundFanpages.forEach(function(fanpage) {
            console.log('Processing fanpage "' + fanpage.facebook.name + '"...');
            
            fanpage.owners.forEach(function(fanpageOwner) {
                Owner.findOne({ '_id': fanpageOwner }, function(err, found) {
                    var token = null;
                    
                    for (i = 0; i < found.fanpages.length; i++) {
                        if (found.fanpages[i].ref.equals(fanpage._id)) {
                            token = found.fanpages[i].token;
                            break;
                        }
                    }
                    
                    FB.setAccessToken(token);
                });
            });
        });
    });
}

// export sync
sync();
