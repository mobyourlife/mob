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
                    
                    // 1446731825581145?locale=pt_BR?fields=id,about,category,category_list,description,likes,link,location,name,parking,phone
                    FB.api(fanpage.facebook.id, { locale: 'pt_BR', fields: ['id', 'about', 'category', 'category_list', 'description', 'likes', 'link', 'location', 'name', 'parking', 'phone'] }, function(records) {
                        if (records) {
                            fanpage.facebook.about = records.about;
                            fanpage.facebook.category = records.category;
                            fanpage.facebook.category_list = records.category_list;
                            fanpage.facebook.description = records.description;
                            fanpage.facebook.likes = records.likes;
                            fanpage.facebook.link = records.link;
                            fanpage.facebook.name = records.name;
                            fanpage.facebook.phone = records.phone;
                            
                            if (records.location) {
                                fanpage.facebook.location.city = records.location.city;
                                fanpage.facebook.location.country = records.location.country;
                                fanpage.facebook.location.street = records.location.street;
                                fanpage.facebook.location.zip = records.location.zip;
                                
                                if (records.location.latitude && records.location.longitude) {
                                    fanpage.facebook.location.coordinates = [ parseFloat(records.location.longitude), parseFloat(records.location.latitude) ];
                                }
                            }
                            
                            if (fanpage.parking) {
                                fanpage.parking.lot = records.parking.lot;
                                fanpage.parking.street = records.parking.street;
                                fanpage.parking.valet = records.parking.valet;
                            }
                            
                            fanpage.save(function(err) {
                                if (err)
                                    throw err;
                            });
                        }
                    });
                });
            });
        });
    });
}

// export sync
sync();
