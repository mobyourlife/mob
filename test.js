var FB = require('fb');
var realtime = require('./realtime')();

var pagetoken = 'CAACEdEose0cBAO1xgKccuZBEClmBoTp5LUu9WpbIppjUca8VyzqZCZCbVB3lTPuHMpHhZBiONUW6Owx8r2O24O5ZAWDNq8V1YoVZA1zPxg2xdMqspDfvHvxNpUUMVKd46Gw01QwcqOjq7slJvmVfDC84xfWUL8twmX8YkzvKNHPkKEjEo4SIYDPsNEIyEbE0XSPKw1uQV8LQZDZD';
var pageid = 1524760321124861;

if (process.argv.length >= 3) {
    switch (process.argv[2]) {
            case 'tabs':
                /* add app to page tabs */
                FB.setAccessToken(pagetoken);
                realtime.addAppToPage(pageid, function(res) {
                    realtime.listPageTabs(pageid, function(tabs) {
                        console.log(tabs);
                    });
                });
            break;
            
        case 'add':
            /* add subscriptions */
            realtime.setAppAccessToken(function(token) {
                realtime.setSubscription('page', 'description,feed', function(ret) {
                    console.log('setSubscription:');
                    console.log(ret);
                    realtime.setSubscription('user', 'about,about_me,quotes', function(ret) {
                        console.log('setSubscription:');
                        console.log(ret);
                    });
                });
            });
            break;
        
        case 'list':
            realtime.setAppAccessToken(function(token) {
                realtime.listSubscriptions(function(records) {
                    console.log('listSubscriptions');
                    console.log(records);
                });
            });
            break;
        
        case 'rm':
            /* delete subscriptions */
            realtime.setAppAccessToken(function(token) {
                realtime.removeSubscription('page', function(ret) {
                    console.log('removeSubscription: ' + ret);
                    realtime.removeSubscription('user', function(ret) {
                        console.log('removeSubscription: ' + ret);
                    });
                });
            });
            break;
    }
}