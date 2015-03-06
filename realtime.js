var mongoose = require('mongoose');
var FB = require('fb');

// init models
var Feed = require('./models/feed');
var Photo = require('./models/photo');
var User = require('./models/user');
var Update = require('./models/update');

module.exports = function() {
    
    var getPending = function(callback) {
        var pending = Array();
        
        if (callback) {
            Update.find({ "updated": { '$ne': true } }).sort({ "data.entry.0.time": 1 }).exec(function(err, found) {
                if (err)
                    throw err;
                
                if (found && found.length != 0) {
                    for (i = 0; i < found.length; i++) {
                        var row = found[i];

                        if (row.data.object === 'page') {
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
                                    }
                                }
                            }
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
    
    var checkAsUpdated = function(rtu_id, callback) {
        Update.update({ _id: rtu_id }, { updated: true }, function(err) {
            if (err)
                throw err;
            
            if (callback) {
                callback();
            }
        });
    }
    
    var checkAsError = function(rtu_id, msg, token, callback) {
        console.log('error: ' + msg);
        Update.update({ _id: rtu_id }, { updated: true, error_time: Date.now(), error_msg: msg, error_token: token }, function(err) {
            if (err)
                throw err;
            
            if (callback) {
                callback();
            }
        });
    }
    
    var fetchPhoto = function(token, page_id, photo_id, rtu_id, callback) {
        FB.api('/v2.2/' + photo_id, { access_token: token}, function(p) {
            if (p.error) {
                checkAsError(rtu_id, p.error, token);
            } else {
                var photo = new Photo();
                photo._id = p.id;
                photo.ref = page_id;
                photo.time = p.updated_time;
                photo.source = p.source;

                if (p.images && p.images.length != 0) {
                    photo.source = p.images[0].source;
                }

                Photo.update({ _id: photo._id }, photo.toObject(), { upsert: true }, function(err) {
                    if (err)
                        throw err;

                    downloadPhoto(photo_id);

                    if (rtu_id) {
                        checkAsUpdated(rtu_id, function() {
                            
                            if (callback) {
                                callback(photo.source);
                            }
                        });
                    } else {
                        if (callback) {
                            callback(photo.source);
                        }
                    }
                });
            }
        });
    }
    
    var fetchFeed = function(token, page_id, post_id, rtu_id) {
        FB.api('/v2.2/' + post_id, { access_token: token, fields: ['id', 'updated_time', 'story', 'picture', 'source', 'link', 'type', 'name', 'caption', 'description', 'message', 'object_id'] }, function(f) {
            if (f.error) {
                checkAsError(rtu_id, f.error, token);
            } else {
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
                
                switch (feed.type) {
                    case 'photo':
                        fetchPhoto(token, page_id, feed.object_id, null, function(picture) {
                            feed.picture = feed.source = picture;
                            
                            Feed.update({ _id: feed._id }, feed.toObject(), { upsert: true }, function(err) {
                                if (err)
                                    throw err;
                        
                                checkAsUpdated(rtu_id);
                            });
                        });
                        break;
                    
                    default:
                        console.log('Tipo de feed não tratado! ' + feed.type);
                        console.log(feed);
                        console.log('---');
                        break;
                }
            }
        });
    }
    
    var removeFeed = function(post_id, rtu_id) {
        Feed.remove({ _id: post_id }, function(err) {
            if (err)
                throw err;
            
            checkAsUpdated(rtu_id);
        });
    }
    
    var ignore = function(rtu_id) {
        checkAsUpdated(rtu_id, null);
    }
    
    var syncPending = function() {
        getPending(function(rows) {
            for (i = 0; i < rows.length; i++) {                            
                getPageToken(rows[i], function(item, token) {
                    switch (item.type) {
                        case 'page.feed.add.photo':
                        case 'page.feed.add.share':
                        case 'page.feed.add.status':
                            fetchFeed(token, item.page_id, item.value.post_id, item.rtu_id);
                            break;
                        
                        case 'page.feed.remove.post':
                            removeFeed(item.value.post_id, item.rtu_id);
                            break;
                        
                        case 'page.feed.add.like':
                        case 'page.feed.add.comment':
                        case 'page.feed.remove.like':
                        case 'page.feed.remove.comment':
                            ignore(item.rtu_id);
                            break;

                        default:
                            console.log('Unknown type: ' + item.type);
                            console.log(item);
                            console.log('---');
                    }
                });
            }
        });
    }

    return {
        syncPending: syncPending
    }
}