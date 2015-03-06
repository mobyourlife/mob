var mongoose = require('mongoose');
var FB = require('fb');

// get db config
var auth = require('./config/auth');
var configDB = require('./config/database');

// connect to database
mongoose.connect(configDB.url);

// init models
var Feed = require('./models/feed');
var Photo = require('./models/photo');
var User = require('./models/user');
var RealtimeUpdate = require('./models/realtime');

module.exports = function() {
    
    var getPending = function(callback) {
        var pending = Array();
        
        if (callback) {
            RealtimeUpdate.find({ "updated": { '$ne': true } }).sort({ "data.entry.0.time": 1 }).exec(function(err, found) {
                if (err)
                    throw err;

                if (found && found.length != 0) {
                    for (i = 0; i < found.length; i++) {
                        var row = found[i];

                        if (row.data.entry && row.data.entry != 0) {
                            for (j = 0; j < row.data.entry.length; j++) {
                                var entry = row.data.entry[j];

                                if (entry.changes && entry.changes.length != 0) {
                                    for (k = 0; k < entry.changes.length; k++) {
                                        var change = entry.changes[k];
                                        var type = row.data.object + '.' + change.field + '.' + change.value.verb + '.' + change.value.item;
                                        pending.push({
                                            rtu_id: row.id,
                                            type: type,
                                            page_id: entry.id,
                                            time: entry.time,
                                            value: change.value
                                        });
                                    }
                                } else {
                                    //console.log('No changes found for:');
                                    //console.log(row.data);
                                }
                            }
                        } else {
                            //console.log('No entries found for:');
                            //console.log(row.data);
                        }
                    }
                }

                callback(pending);
            });
        } else {
            console.log('Error: No callback was supplied to realtime.getPending! Aborting operation.');
        }
    }
    
    var getPageToken = function(item, callback) {
        User.find({ fanpages: { $elemMatch: { id: item.page_id } } }, function(err, found) {
            for (i = 0; i < found.length; i++) {
                var owner = found[i];
                for (j = 0; j < owner.fanpages.length; j++) {
                    var fp = owner.fanpages[j];
                    if (callback) {
                        callback(item, fp.access_token);
                    }
                    return;
                }
            }
        });
    }
    
    var downloadPhoto = function() {
    }
    
    var pageFeedAddPhoto = function(token, rtu_id, page_id, post_id) {
        FB.api('/v2.2/' + post_id, { access_token: token, fields: ['id', 'updated_time', 'story', 'picture', 'source', 'link', 'type', 'name', 'caption', 'description', 'message', 'object_id'] }, function(f) {
            if (!f.error) {
                var feed = new Feed();
                feed._id = f.id;
                feed.ref = page_id;
                feed.time = f.updated_time;
                feed.story = f.story;
                feed.picture = f.picture;
                feed.source = f.source;
                feed.link = f.link;
                feed.type = f.type;
                feed.name = f.name;
                feed.caption = f.caption;
                feed.description = f.description;
                feed.message = f.message;
                feed.object_id = f.object_id;
                
                FB.api('/v2.2/' + f.object_id, { access_token: token}, function(p) {
                    if (!p.error) {
                        var photo = new Photo();
                        photo._id = p.id;
                        photo.ref = page_id;
                        photo.time = p.updated_time;
                        photo.source = p.source;
                        
                        if (p.images && p.images.length != 0) {
                            photo.source = p.images[0].source;
                        }
                        
                        if (feed.type === 'photo') {
                            feed.picture = feed.source = photo.source;
                        }
                        
                        Photo.update({ _id: photo._id }, photo.toObject(), { upsert: true }, function(err) {
                            if (err)
                                throw err;
                        
                            Feed.update({ _id: feed._id }, feed.toObject(), { upsert: true }, function(err) {
                                if (err)
                                    throw err;
                                
                                downloadPhoto(feed.object_id);
                                
                                RealtimeUpdate.update({ _id: rtu_id }, { updated: true }, function(err) {
                                    if (err)
                                        throw err;
                                });
                            });
                        });
                    }
                });
            }
        });
    }
    
    var syncPending = function() {
        getPending(function(rows) {
            for (i = 0; i < rows.length; i++) {
                getPageToken(rows[i], function(item, token) {
                    switch (item.type) {
                        case 'page.feed.add.photo':
                            pageFeedAddPhoto(token, item.rtu_id, item.page_id, item.value.post_id);
                            break;

                        default:
                            console.log('Unknown type: ' + item.type);
                    }
                });
            }
        });
    }

    return {
        syncPending: syncPending
    }
}