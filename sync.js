/* jslint node: true */

var mongoose = require('mongoose');
var FB = require('fb');

// load models
var Fanpage = require('./models/fanpage');
var User = require('./models/user');
var Photo = require('./models/photo');
var Feed = require('./models/feed');

// get db config
var auth = require('./config/auth');
var configDB = require('./config/database');

module.exports = function() {
    // fetch photos function
    var fetchPhotos = function(fanpage, albumid, direction, cursor) {
        var args = { locale: 'pt_BR', fields: ['id', 'source', 'updated_time', 'images'] };

        if (direction && cursor) {

            switch (direction) {
                case 'before':
                    args.before = cursor;
                    break;

                case 'after':
                    args.after = cursor;
                    break;
            }
        }

        FB.api(albumid + '/photos', args, function(records) {
            if (records && records.data) {
                for (i = 0; i < records.data.length; i++) {
                    var item = new Photo();
                    item._id = records.data[i].id;
                    item.ref = fanpage;
                    item.source = records.data[i].source;
                    item.time = records.data[i].updated_time;

                    if (records.data[i].images) {
                        for (j = 0; j < records.data[i].images.length && records.data[i].images[j].width > 1000; j++) {
                            item.source = records.data[i].images[j].source;
                        }
                    }

                    Photo.update({ _id: item._id }, item.toObject(), { upsert: true }, function(err) {
                        if (err)
                            throw err;
                    });
                }

                if (records.paging && records.paging.cursors) {
                    if (records.paging.cursors.after) {
                        fetchPhotos(fanpage, albumid, 'after', records.paging.cursors.before);
                    }
                }
            }
        });
    }

    // fetch albums functions
    var fetchAlbums = function(fanpage) {
        console.log('Fetching albums for fanpage "' + fanpage._id + '" named "' + fanpage.facebook.name + '"...');
        var args = { locale: 'pt_BR', fields: ['id'] };

        FB.api(fanpage._id + '/albums', args, function(records) {
            if (records && records.data) {
                for (i = 0; i < records.data.length; i++) {
                    fetchPhotos(fanpage, records.data[i].id);
                }
            }
        });
    }

    // fetch feed function
    var fetchFeed = function(fanpage, direction, cursor) {
        var safe_image = function(url) {
            var cfs = /\/safe_image\.php\?.*url=(.*)(&cfs=1)/.exec(url);
            var result = /\/safe_image\.php\?.*url=(.*)/.exec(url);

            if (cfs) {
                return unescape(cfs[1]);
            } else if (result) {
                return unescape(result[1]);
            }

            return url;
        }

        var args = { locale: 'pt_BR', limit: 25, fields: ['id', 'story', 'picture', 'link', 'updated_time', 'type', 'name', 'caption', 'description', 'message', 'object_id', 'source'] };

        if (direction && cursor) {

            switch (direction) {
                case 'since':
                    args.since = cursor;
                    break;

                case 'until':
                    args.until = cursor;
                    break;
            }
        }

        FB.api(fanpage._id + '/feed', args, function(records) {
            if (records && records.data) {
                for (i = 0; i < records.data.length; i++) {
                    if (records.data[i].type == 'status') {
                        continue;
                    }

                    var item = new Feed();
                    item._id = records.data[i].id;
                    item.ref = fanpage;
                    item.time = records.data[i].updated_time;
                    item.story = records.data[i].story;
                    item.picture = safe_image(records.data[i].picture);
                    item.source = records.data[i].source;
                    item.link = records.data[i].link;
                    item.type = records.data[i].type;
                    item.name = records.data[i].name;
                    item.caption = records.data[i].caption;
                    item.description = records.data[i].description;
                    item.message = records.data[i].message;
                    item.object_id = records.data[i].object_id;

                    Feed.update({ _id: item._id }, item.toObject(), { upsert: true }, function(err) {
                        if (err)
                            throw err;
                    });

                    if (item.object_id) {
                        FB.api(item.object_id, { locale: 'pt_BR', fields: ['picture', 'source', 'images'] }, function(inner_object) {
                            var picture = null;

                            if (inner_object.source) {
                                picture = safe_image(inner_object.source);
                            }

                            if (inner_object.images) {
                                for (j = 0; j < inner_object.images.length && inner_object.images[j].width > 1000; j++) {
                                    picture = safe_image(inner_object.images[j].source);
                                }
                            }

                            if (picture != null) {
                                Feed.update({ object_id: inner_object.id }, { "picture": picture }, { upsert: true }, function(err) {
                                    if (err)
                                        throw err;
                                });
                            }
                        });
                    }
                }

                if (records.paging) {
                    if (records.paging.next) {
                        var args = /.*until=([0-9]+)/.exec(records.paging.next);

                        if (args) {
                            fetchFeed(fanpage, 'until', args[1]);
                        }
                    }
                }
            }
        });
    }
    
    // sync profile
    var fetchProfile = function(fanpage, callback) {
        console.log('Fetching profile for fanpage "' + fanpage._id + '" named "' + fanpage.facebook.name + '"...');
        FB.api(fanpage._id, { locale: 'pt_BR', fields: ['id', 'name', 'about', 'description', 'picture', 'category', 'category_list', 'is_verified', 'link', 'website', 'emails', 'checkins', 'likes', 'talking_about_count', 'were_here_count', 'phone', 'location', 'parking', 'general_info', 'hours', 'band_members', 'booking_agent', 'press_contact', 'hometown', 'company_overview', 'founded', 'mission', 'directed_by', 'attire', 'general_manager', 'price_range', 'restaurant_services', 'restaurant_specialties', 'birthday', 'payment_options'] }, function(records) {
            if (records) {
                fanpage.facebook.name = records.name;
                fanpage.facebook.about = records.about;
                fanpage.facebook.description = records.description;
                
                if (records.picture && records.picture.data) {
                    fanpage.facebook.picture = records.picture.data.url;
                }
                
                fanpage.facebook.category = records.category;
                fanpage.facebook.category_list = records.category_list;
                fanpage.facebook.is_verified = records.is_verified;
                fanpage.facebook.link = records.link;
                fanpage.facebook.website = records.website;
                fanpage.facebook.emails = records.emails;

                /* stats */
                fanpage.facebook.stats.checkins = records.checkins;
                fanpage.facebook.stats.likes = records.likes;
                fanpage.facebook.stats.talking_about_count = records.talking_about_count;
                fanpage.facebook.stats.were_here_count = records.were_here_count;

                /* place nformation */
                fanpage.facebook.place.phone = records.phone;

                /* location */
                if (records.location) {
                    fanpage.facebook.place.location.street = records.location.street;
                    fanpage.facebook.place.location.city = records.location.city;
                    fanpage.facebook.place.location.state = records.location.state;
                    fanpage.facebook.place.location.country = records.location.country;
                    fanpage.facebook.place.location.zip = records.location.zip;

                    if (records.location.latitude && records.location.longitude) {
                        fanpage.facebook.place.location.coordinates = [ parseFloat(records.location.latitude), parseFloat(records.location.longitude) ];
                    }
                }

                /* parking information */
                if (records.parking) {
                    fanpage.facebook.place.parking.lot = records.parking.lot;
                    fanpage.facebook.place.parking.street = records.parking.street;
                    fanpage.facebook.place.parking.valet = records.parking.valet;
                }

                /* extra info */
                fanpage.facebook.info.general_info = records.general_info;
                fanpage.facebook.info.hours = records.hours;
                fanpage.facebook.info.impressum = records.impressum;

                /* bands */
                fanpage.facebook.info.band.band_members = records.band_members;
                fanpage.facebook.info.band.booking_agent = records.booking_agent;
                fanpage.facebook.info.band.press_contact = records.press_contact;
                fanpage.facebook.info.band.hometown = records.hometown;

                /* company */
                fanpage.facebook.info.company.company_overview = records.company_overview;
                fanpage.facebook.info.company.founded = records.founded;
                fanpage.facebook.info.company.mission = records.mission;

                /* film */
                fanpage.facebook.info.film.directed_by = records.directed_by;

                /* restaurants and night life */
                fanpage.facebook.info.foodnight.attire = records.attire;
                fanpage.facebook.info.foodnight.general_manager = records.general_manager;
                fanpage.facebook.info.foodnight.price_range = records.price_range;

                /* restaurants services */
                if (records.restaurant_services) {
                    fanpage.facebook.info.foodnight.restaurant.services.kids = records.restaurant_services.kids;
                    fanpage.facebook.info.foodnight.restaurant.services.delivery = records.restaurant_services.delivery;
                    fanpage.facebook.info.foodnight.restaurant.services.walkins = records.restaurant_services.walkins;
                    fanpage.facebook.info.foodnight.restaurant.services.catering = records.restaurant_services.catering;
                    fanpage.facebook.info.foodnight.restaurant.services.reserve = records.restaurant_services.reserve;
                    fanpage.facebook.info.foodnight.restaurant.services.groups = records.restaurant_services.groups;
                    fanpage.facebook.info.foodnight.restaurant.services.waiter = records.restaurant_services.waiter;
                    fanpage.facebook.info.foodnight.restaurant.services.outdoor = records.restaurant_services.outdoor;
                    fanpage.facebook.info.foodnight.restaurant.services.takeout = records.restaurant_services.takeout;
                }

                /* restaurants specialties */
                if (records.restaurant_specialties) {
                    fanpage.facebook.info.foodnight.restaurant.specialties.coffee = records.restaurant_specialties.coffee;
                    fanpage.facebook.info.foodnight.restaurant.specialties.drinks = records.restaurant_specialties.drinks;
                    fanpage.facebook.info.foodnight.restaurant.specialties.breakfast = records.restaurant_specialties.breakfast;
                    fanpage.facebook.info.foodnight.restaurant.specialties.dinner = records.restaurant_specialties.dinner;
                    fanpage.facebook.info.foodnight.restaurant.specialties.lunch = records.restaurant_specialties.lunch;
                }

                /* personality */
                fanpage.facebook.info.personality.birthday = records.birthday;

                /* payment options */
                if (records.payment_options) {
                    fanpage.facebook.info.payment_options.amex = records.payment_options.amex;
                    fanpage.facebook.info.payment_options.cash_only = records.payment_options.cash_only;
                    fanpage.facebook.info.payment_options.discover = records.payment_options.discover;
                    fanpage.facebook.info.payment_options.mastercard = records.payment_options.mastercard;
                    fanpage.facebook.info.payment_options.visa = records.payment_options.visa;
                }

                fanpage.save(function(err) {
                    if (err)
                        throw err;
                    
                    if (callback) {
                        callback();
                    }
                });
            }
        });
    }

    // sync fanpage
    var syncFanpage = function(fanpage) {
        console.log('Processing fanpage "' + fanpage._id + '" named "' + fanpage.facebook.name + '"...');

        User.findOne({ '_id': fanpage.creation.user }, function(err, found) {
            var token = null;

            if (found && found.fanpages && found.fanpages.length != 0) {
                for (i = 0; i < found.fanpages.length; i++) {
                    if (found.fanpages[i].id.localeCompare(fanpage._id) == 0) {
                        token = found.fanpages[i].access_token;
                        break;
                    }
                }
            }

            if (token) {
                FB.setAccessToken(token);
                fetchProfile(fanpage);
                fetchAlbums(fanpage);
                fetchFeed(fanpage);
            } else {
                console.log('Cannot find token for fanpage "' + fanpage._id + '" named "' + fanpage.facebook.name + '"...');
            }
        });
    }

    // app loop
    var syncAll = function() {
        console.log('Running Sync');

        Fanpage.find({}, function(err, foundFanpages) {
            foundFanpages.forEach(function(fanpage) {
                syncFanpage(fanpage);
            });
        });
    }

    return {
        fetchPhotos: fetchPhotos,
        fetchAlbums: fetchAlbums,
        fetchFeed: fetchFeed,
        fetchProfile: fetchProfile,
        syncFanpage: syncFanpage,
        syncAll: syncAll
    };
}