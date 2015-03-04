var FB = require('fb');
var realtime = require('./realtime')();

var pagetoken = 'CAAJl90fLKOEBAP5ihessDSZB3FyZCgdWrT4ZCMh4VZAk9u2ZC411k6QZAI6USYwdzvYevQdYDwtu9N4orQNE9pFTpYPitp5rYbEb1C62Lnba7kqJCxpxEBDhvgmSs0MoZBkbLGjQPkEZCsflYkGTig1U4uTw2Habi8owZBGEVNHd8xxbCQNHXzFR0Nqst7ZB7B0RYZD';
var pageid = 459027277572154;

if (process.argv.length >= 3) {
    switch (process.argv[2]) {
        /* add app to page tabs */
        case 'tabs':
            FB.setAccessToken(pagetoken);
            realtime.addAppToPage(pageid, function(res) {
                realtime.listPageTabs(pageid, function(tabs) {
                    console.log(tabs);
                });
            });
            break;
            
        /* add subscriptions */
        case 'add':
            realtime.setAppAccessToken(function(token) {
                realtime.setSubscription('page', 'description,feed', function(ret) {
                    console.log('setSubscription:');
                    console.log(ret);
                });
            });
            break;
        
        /* list subscriptions */
        case 'list':
            realtime.setAppAccessToken(function(token) {
                realtime.listSubscriptions(function(records) {
                    console.log('listSubscriptions');
                    console.log(records);
                });
            });
            break;
        
        /* delete subscriptions */
        case 'rm':
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