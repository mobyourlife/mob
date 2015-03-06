var mongoose = require('mongoose');
var FB = require('fb');

// get db config
var auth = require('./config/auth');
var configDB = require('./config/database');

// connect to database
mongoose.connect(configDB.url);

// init models
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
                                            type: type,
                                            page_id: entry.id,
                                            time: entry.time,
                                            value: change.value
                                        });
                                    }
                                } else {
                                    console.log('No changes found for:');
                                    console.log(row.data);
                                }
                            }
                        } else {
                            console.log('No entries found for:');
                            console.log(row.data);
                        }
                    }
                }

                callback(pending);
            });
        } else {
            console.log('Error: No callback was supplied to realtime.getPending! Aborting operation.');
        }
    }
    
    var addPhoto = function() {
    }
    
    var removePhoto = function() {
    }
    
    var downloadPhoto = function() {
    }
    
    var syncPending = function() {
        getPending(function(rows) {
            for (i = 0; i < rows.length; i++) {
                var item = rows[i];
                switch (item.type) {
                    case 'page.feed.add.photo':
                        console.log(item);
                        break;
                    
                    default:
                        console.log('Unknown type: ' + item.type);
                }
            }
        });
    }

    return {
        syncPending: syncPending
    }
}