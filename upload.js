var request = require('request');
var AWS = require('aws-sdk'); 

AWS.config.region = 'sa-east-1';
var s3 = new AWS.S3({ params: { Bucket: 'cdn.mobyourlife.com.br', ACL: 'public-read' } });

var uri = 'https://scontent-a.xx.fbcdn.net/hphotos-xpa1/v/t1.0-9/s720x720/10669995_928529287171488_7148470817711414655_n.png?oh=74d413e75efe497f6689b3719b93a415&oe=5555AB41';
var destination = '1446731825581145_1522107401376920.png';

var http = require('http');
var fs = require('fs');

request.get({ uri: uri, encoding: 'binary' }, function (error, response, recv) {
    if (!error && response.statusCode == 200) {
        var body = new Buffer(recv, 'binary');
        var params = { Key: destination, Body: body, ContentType: response.headers['content-type'] };
        
        console.log('mime type: ' + response.headers['content-type']);
        console.log('body length: ' + body.length);
        
        s3.upload(params, function(err, data) {
            if (err)
                console.log(err)
            else
                console.log("Successfully uploaded data to myBucket/myKey");
        });
    }
});
