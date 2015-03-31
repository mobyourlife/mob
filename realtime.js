var mongoose = require('mongoose');
var FB = require('fb');
var sync = require('./sync')();
var helpers = require('./bin/helpers')();

// init models
var Fanpage = require('./models/fanpage');
var Feed = require('./models/feed');
var Photo = require('./models/photo');
var Video = require('./models/video');
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
                                            var type = row.data.object;
                                            
                                            if (change.value) {
                                                type +=  '.' + change.field;
                                                type += '.' + change.value.verb + '.' + change.value.item;
                                            }
                                            
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
    
    var fetchAlbum = function(token, page_id, album_id) {
        FB.api('/v2.2/' + album_id, { access_token: token, locale: 'pt_BR', fields: ['id', 'name', 'updated_time'] }, function(info) {
            if (info) {
                Album.update({ _id: album_id }, { name: info.name, time: info.updated_time, ref: page_id, path: helpers.formatAsPath(records.data[i].name) + '-' + records.data[i].id }, function(err) {
                    if (err)
                        throw err;
                });
            }
        });
    }
    
    var fetchPhoto = function(token, page_id, photo_id, rtu_id, callback) {
        FB.api('/v2.2/' + photo_id, { access_token: token, locale: 'pt_BR', fields: ['id', 'source', 'updated_time', 'images', 'album', 'name'] }, function(p) {
            if (p.error) {
                checkAsError(rtu_id, p.error, token);
            } else {
                var photo = new Photo();
                photo._id = p.id;
                photo.ref = page_id;
                photo.source = safe_image(p.source);
                photo.time = p.updated_time;
                photo.name = p.name;
                photo.album_id = p.album.id;

                if (p.images && p.images.length != 0) {
                    photo.source = safe_image(p.images[0].source);
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
    
    var fetchVideo = function(token, page_id, feed, rtu_id, callback) {
        var callbackVideo = function() {
            Video.find({ ref: page_id }, function(err, allvids) {
                if (err)
                    throw err;
                
                console.log('Total de ' + allvids.length + ' videos na fanpage ' + page_id);
                Fanpage.update({ _id: page_id }, { video_count: allvids.length }, function(err) {
                    if (err)
                        throw err;
                });
            });
            
            if (rtu_id) {
                checkAsUpdated(rtu_id, function() {
                    if (callback) {
                        callback();
                    }
                });
            } else {
                if (callback) {
                    callback();
                }
            }
        }
        
        var saveVideo = function(video) {
            Video.update({ _id: video._id }, video.toObject(), { upsert: true }, function(err) {
                if (err)
                    throw err;

                callbackVideo();
            });
        }
        
        /* check if it's a FB video */
        if (feed.object_id) {
            FB.api('/v2.2/' + feed.object_id, { access_token: token, locale: 'pt_BR', fields: ['id', 'updated_time', 'description', 'name'] }, function(fbvid) {
                if (fbvid) {
                    var video = new Video();
                    video._id = fbvid.id;
                    video.ref = page_id;
                    video.time = fbvid.updated_time;
                    video.name = fbvid.name;
                    video.description = fbvid.description;
                    video.link = 'https://www.facebook.com/video.php?v=' + feed.object_id;
                    saveVideo(video);
                } else {
                    callbackVideo();
                }
            });
        } else {
            /* or an external video */
            var video = new Video();
            video._id = feed.id;
            video.ref = page_id;
            video.time = feed.updated_time;
            video.name = feed.name;
            video.description = feed.description;
            video.link = feed.link;
            saveVideo(video);
        }
    }
    
    // sync existing videos
    var syncExistingVideos = function() {
        console.log('Syncing existing videos');
        
        Feed.find({ type: 'video' }, function(err, found) {
            if (err)
                throw err;

            found.forEach(function(item) {
                Fanpage.findOne({ _id: item.ref }, function(err, fp) {
                    if (err)
                        throw err;
                    
                    User.findOne({ _id: fp.creation.user }, function(err, user) {
                        if (err)
                            throw err;
                        
                        if (user) {
                            if (user.fanpages) {
                                for (i = 0; i < user.fanpages.length; i++) {
                                    if (user.fanpages[i].id === fp._id) {
                                        fetchVideo(user.fanpages[i].access_token, item.ref, item);
                                    }
                                }
                            }
                        }
                    });
                });
            });
        });
    }
    
    var fetchFeed = function(token, page_id, post_id, rtu_id) {
        FB.api('/v2.2/' + post_id, { access_token: token, locale: 'pt_BR', fields: ['id', 'updated_time', 'story', 'picture', 'source', 'link', 'type', 'name', 'caption', 'description', 'message', 'object_id', 'actions'] }, function(f) {
            if (f.error) {
                checkAsError(rtu_id, f.error, token);
            } else {
                var feed = new Feed();
                feed._id = f.id;
                feed.ref = page_id;
                feed.time = f.updated_time;
                feed.story = f.story;
                feed.picture = safe_image(f.picture);
                feed.source = safe_image(f.source);
                
                if (f.type === 'status' && f.actions) {
                    feed.link = f.actions[0].link;
                } else {
                    feed.link = f.link;
                }
                
                feed.type = f.type;
                feed.name = f.name;
                feed.caption = f.caption;
                feed.description = f.description;
                feed.message = f.message;
                feed.object_id = f.object_id;
                
                switch (feed.type) {
                    case 'photo':
                        fetchPhoto(token, page_id, feed.object_id, null, function(picture) {
                            feed.picture = safe_image(feed.source = picture);
                            
                            Feed.update({ _id: feed._id }, feed.toObject(), { upsert: true }, function(err) {
                                if (err)
                                    throw err;
                        
                                checkAsUpdated(rtu_id);
                            });
                        });
                        break;
                    
                    case 'video':
                        fetchVideo(token, page_id, feed, null, function(picture) {
                            Feed.update({ _id: feed._id }, feed.toObject(), { upsert: true }, function(err) {
                                if (err)
                                    throw err;
                        
                                checkAsUpdated(rtu_id);
                            });
                        });
                        break;
                    
                    case 'share':
                    case 'status':
                    case 'link':
                    case 'post':
                        Feed.update({ _id: feed._id }, feed.toObject(), { upsert: true }, function(err) {
                            if (err)
                                throw err;

                            checkAsUpdated(rtu_id);
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
        var rmfeed = function() {
            Feed.remove({ _id: post_id }, function(err) {
                if (err)
                    throw err;

                checkAsUpdated(rtu_id);
            });
        }
        
        Feed.find({ _id: post_id }, function(err, found) {
            if (found) {
                if (found.type === 'photo') {
                    Photo.remove({ _id: found.object_id }, function(err) {
                        if (err)
                            throw err;

                        rmfeed();
                    });
                } else {
                    rmfeed();
                }
            }
        });
    }
    
    var fetchProfile = function(fanpage_id, rtu_id) {
        Fanpage.findOne({ _id: fanpage_id }, function(err, found) {
            if (err)
                throw err;
            
            if (found) {
                sync.fetchProfile(found, function() {
                    checkAsUpdated(rtu_id);
                });
            }
        });
    }

    
    var ignore = function(rtu_id) {
        checkAsUpdated(rtu_id);
    }
    
    var syncPending = function() {
        getPending(function(rows) {
            for (i = 0; i < rows.length; i++) {                            
                getPageToken(rows[i], function(item, token) {
                    switch (item.type) {
                        case 'page.feed.add.photo':
                        case 'page.feed.add.share':
                        case 'page.feed.add.status':
                        case 'page.feed.add.link':
                        case 'page.feed.add.video':
                        case 'page.feed.add.post':
                            fetchFeed(token, item.page_id, item.value.post_id, item.rtu_id);
                            break;
                        
                        case 'page.feed.remove.photo':
                        case 'page.feed.remove.share':
                        case 'page.feed.remove.status':
                        case 'page.feed.remove.link':
                        case 'page.feed.remove.video':
                        case 'page.feed.remove.post':
                            removeFeed(item.value.post_id, item.rtu_id);
                            break;
                            
                        case 'page':
                        case 'page.feed.add.like':
                        case 'page.feed.remove.like':
                            fetchProfile(item.page_id, item.rtu_id);
                            break;
                        
                        case 'page.feed.add.comment':
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
        syncPending: syncPending,
        syncExistingVideos: syncExistingVideos
    }
}