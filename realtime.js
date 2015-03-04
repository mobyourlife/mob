var FB = require('fb');
var auth = require('./config/auth');

module.exports = function() {
    
    var setAppAccessToken = function(callback) {
        FB.api('oauth/access_token', {
            client_id: auth.facebookAuth.clientID,
            client_secret: auth.facebookAuth.clientSecret,
            grant_type: 'client_credentials'
        }, function(res) {
            if (!res || res.error) {
                console.log(!res ? 'Erro insperado!' : res.error);
                return;
            }

            FB.setAccessToken(res.access_token);

            if (callback) {
                callback(res.access_token);
            }
        });
    }
    
    var addAppToPage = function(pageid, callback) {
        FB.api('/' + pageid + '/tabs', 'post', {
            app_id: auth.facebookAuth.clientID
        }, function(res) {
            if (callback) {
                callback(res);
            }
        });
    }
    
    var listPageTabs = function(pageid, callback) {
        FB.api('/' + pageid + '/tabs', function(res) {
            if (callback) {
                callback(res);
            }
        });
    }
    
    var setSubscription = function(callback) {
        FB.api('/' + auth.facebookAuth.clientID + '/subscriptions', 'post', {
            object: 'page',
            callback_url: auth.facebookAuth.realtimeURL,
            fields: 'description',
            verify_token: '123456'
        }, function(res) {
            if(callback) {
                callback(res);
            }
        });
    }
    
    var removeSubscription = function(callback) {
        FB.api('/' + auth.facebookAuth.clientID + '/subscriptions', 'delete', {
            object: 'page'
        }, function(res) {
            if (callback) {
                callback(res);
            }
        });
    }

    var listSubscriptions = function(callback) {
        FB.api('/' + auth.facebookAuth.clientID + '/subscriptions', function(records) {
            if (callback) {
                callback(records);
            }
        });
    }

    return {
        setAppAccessToken: setAppAccessToken,
        addAppToPage: addAppToPage,
        listPageTabs: listPageTabs,
        setSubscription: setSubscription,
        removeSubscription: removeSubscription,
        listSubscriptions: listSubscriptions
    }
}