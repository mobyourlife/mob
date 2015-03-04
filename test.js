var realtime = require('./realtime')();

realtime.setAppAccessToken(function(token) {
    realtime.setSubscription(function(ret) {
        console.log(ret);
        realtime.listSubscriptions(function(records) {
            console.log(records);
        });
    });
});