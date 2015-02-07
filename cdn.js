var mongoose = require('mongoose');
var request = require('request');
var AWS = require('aws-sdk');

// db collections
var Fanpage = require('./models/fanpage');
var Feed = require('./models/feed');
var Photo = require('./models/photo');

// set db config
var configDB = require('./config/database');
var configAWS = require('./config/aws');
mongoose.connect(configDB.url);

AWS.config.region = configAWS.region;
var s3 = new AWS.S3({ params: { Bucket: configAWS.bucket, ACL: 'public-read' } });

// function to download external images and upload to s3
up2cdn = function(uri, destination, callback) {
    request.get({ uri: uri, encoding: 'binary' }, function (error, response, recv) {
        if (!error && response.statusCode == 200) {
            var body = new Buffer(recv, 'binary');
            
            var ext = 'jpg';
            switch (response.headers['content-type']) {
                case 'image/jpeg':
                    ext = 'jpg';
                    break;
                    
                case 'image/png':
                    ext = 'png';
                    break;
                
                case 'image/svg+xml':
                    ext = 'svg';
                    break;
                    
                case 'image/gif':
                    ext = 'gif';
                    break;
                    
                default:
                    break;
            }
            var destfn = destination + '.' + ext;
            
            var params = { Key: destfn, Body: body, ContentType: response.headers['content-type'] };
            s3.upload(params, function(err, data) {
                if (err) {
                    console.log(err)
                } else {
                    var desturi = configAWS.endpoint + destfn;
                    callback(desturi);
                }
            });
        }
    });
}

// processes all pending images from the database
cdn = function() {
    Fanpage.find({ "facebook.cdn": null }, function(err, records) {
        records.forEach(function(item) {
            if (item.facebook.picture != null) {
                var uri = item.facebook.picture;
                var dest = 'fanpages/' + item.facebook.id;
                up2cdn(uri, dest, function(cdnuri) {
                    item.facebook.cdn = cdnuri;
                    item.save(function(err) {
                        if (err)
                            throw err;
                    });
                });
            }
        });
    });
    
    Feed.find({ "cdn": null }, function(err, records) {
        records.forEach(function(item) {
            if (item.picture != null || item.source != null) {
                var uri = (item.picture != null ? item.picture : item.source);
                var dest = 'feeds/' + item.id;
                up2cdn(uri, dest, function(cdnuri) {
                    item.cdn = cdnuri;
                    item.save(function(err) {
                        if (err)
                            throw err;
                    });
                });
            }
        });
    });
    
    Photo.find({ "cdn": null }, function(err, records) {
        records.forEach(function(item) {
            if (item.source != null) {
                var uri = item.source;
                var dest = 'photos/' + item.id;
                up2cdn(uri, dest, function(cdnuri) {
                    item.cdn = cdnuri;
                    item.save(function(err) {
                        if (err)
                            throw err;
                    });
                });
            }
        });
    });
}

// run cdn script
cdn();
