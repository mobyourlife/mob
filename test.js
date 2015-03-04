var FB = require('fb');
var realtime = require('./realtime')();

var pagetoken = 'CAACEdEose0cBAEoYywu0EF6dunBA4m6xs4xiGCFPaSlV2mACfYNYzr63OCKIFuYFbsrAbNrCsPpB98BXE5i3LLB8mOMq6lOkYy1CHrovqtRROX1sxGZASKH3zy0htIzG1QWshUnAO5QSUEakITRqeEeKxGL3lWldZA8lVbNw1uPRuTmAXUx6XyIpQO0uCY4mYVVepPQwZDZD';
var pageid = 1524760321124861;

FB.setAccessToken(pagetoken);

realtime.addAppToPage(pageid, function(res) {
    console.log('addAppToPage: ' + res);
    realtime.listPageTabs(pageid, function(tabs) {
        console.log('listPageTabs:');
        console.log(tabs);
        realtime.setAppAccessToken(function(token) {
            realtime.removeSubscription(function(ret) {
                console.log('removeSubscription: ' + ret);
                realtime.setSubscription(function(ret) {
                    console.log('setSubscription: ' + ret);
                    realtime.listSubscriptions(function(records) {
                        console.log('listSubscriptions');
                        console.log(records);
                    });
                });
            });
        });
    });
});