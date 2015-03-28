var FB = require('fb');
var auth = require('./config/auth');
var RTU = require('./realtime')();
var sync = require('./sync')();
var email = require('./bin/email')();
var Fanpage = require('./models/fanpage');

// connect to database
var mongoose = require('mongoose');
var configDB = require('./config/database');
mongoose.connect(configDB.url);

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

var setSubscription = function(object, fields, callback) {
    FB.api('/' + auth.facebookAuth.clientID + '/subscriptions', 'post', {
        object: object,
        callback_url: auth.facebookAuth.realtimeURL,
        fields: fields,
        verify_token: '123456'
    }, function(res) {
        if(callback) {
            callback(res);
        }
    });
}

var removeSubscription = function(object, callback) {
    FB.api('/' + auth.facebookAuth.clientID + '/subscriptions', 'delete', {
        object: object
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

var subscribeApp = function(pageid, callback) {
    FB.api('/v2.2/' + pageid + '/subscribed_apps', 'post', function(res) {
        if (callback) {
            callback(res);
        }
    });
}

var unsubscribeApp = function(pageid, callback) {
    FB.api('/v2.2/' + pageid + '/subscribed_apps', 'delete', function(res) {
        if (callback) {
            callback(res);
        }
    });
}

var listApps = function(pageid, callback) {
    FB.api('/v2.2/' + pageid + '/subscribed_apps', function(records) {
        if (callback) {
            callback(records);
        }
    });
}


if (process.argv.length >= 3) {
    switch (process.argv[2]) {
        /* add app to page tabs */
        case 'tabs':
            if (process.argv.length >= 5) {
                FB.setAccessToken(process.argv[4]);
                addAppToPage(process.argv[3], function(res) {
                    listPageTabs(process.argv[3], function(tabs) {
                        console.log(tabs);
                    });
                });
            } else {
                console.log('Uso correto: node test tabs PAGE_ID PAGE_ACCESS_TOKEN');
            }
            break;
            
        /* subscribe app to receive realtime updates */
        case 'sign':
            if (process.argv.length >= 5) {
                FB.setAccessToken(process.argv[4]);
                subscribeApp(process.argv[3], function(res) {
                    listApps(process.argv[3], function(apps) {
                        console.log(apps);
                    });
                });
            } else {
                console.log('Uso correto: node test sign PAGE_ID PAGE_ACCESS_TOKEN');
            }
            break;
            
        /* subscribe app to receive realtime updates */
        case 'unsign':
            if (process.argv.length >= 5) {
                FB.setAccessToken(process.argv[4]);
                unsubscribeApp(process.argv[3], function(res) {
                    listApps(process.argv[3], function(apps) {
                        console.log(apps);
                    });
                });
            } else {
                console.log('Uso correto: node test sign PAGE_ID PAGE_ACCESS_TOKEN');
            }
            break;
            
        /* add subscriptions */
        case 'add':
            setAppAccessToken(function(token) {
                setSubscription('page', 'feed, name, picture, category, description, founded, company_overview, conversations, mission, products, general_info, location, hours, parking, public_transit, phone, email, website, attire, payment_options, culinary_team, general_manager, price_range, restaurant_services, restaurant_specialties, videos, release_date, genre, starring, screenplay_by, directed_by, produced_by, studio, awards, plot_outline, network, season, schedule, written_by, band_members, hometown, current_location, record_label, booking_agent, press_contact, artists_we_like, influences, band_interests, bio, affiliation, birthday, personal_info, personal_interests, members, built, features, mpg, checkins, productlists', function(ret) {
                    console.log('setSubscription:');
                    console.log(ret);
                });
                /*setSubscription('user', 'about, about_me, activities, birthday, birthday_date, books, checkins, contact_email, current_location, email, email_hashes, events, feed, first_name, friends, has_added_app, hometown, hometown_location, interests, is_app_user, is_blocked, last_name, likes, link, locale, location, movies, music, name, photos, pic, picture, political_views, profile_blurb, profile_update_time, profile_url, proxied_email, quotes, timezone, television, tv, videos, website, status', function(ret) {
                    console.log('setSubscription:');
                    console.log(ret);
                });*/
            });
            break;
        
        /* list subscriptions */
        case 'list':
            setAppAccessToken(function(token) {
                listSubscriptions(function(records) {
                    console.log('listSubscriptions');
                    console.log(records);
                });
            });
            break;
        
        /* delete subscriptions */
        case 'rm':
            setAppAccessToken(function(token) {
                removeSubscription('page', function(ret) {
                    console.log('removeSubscription: ' + ret);
                });
                removeSubscription('user', function(ret) {
                    console.log('removeSubscription: ' + ret);
                });
            });
            break;
        
        /* realtime updates */
        case 'rtu':
            RTU.syncPending();
            break;
        
        /* sync all */
        case 'syncall':
            sync.syncAll();
            break;
        
        /* sync fanpage */
        case 'syncfanpage':
            if (process.argv.length >= 4) {
                var page_id = process.argv[3].toString();
                Fanpage.findOne({ _id: page_id }, function(err, one) {
                    if (err)
                        throw err;
                    
                    if (one) {
                        if (process.argv.length >= 5) {
                            sync.syncFanpage(one, process.argv[4].toString());
                        } else {
                            sync.syncFanpage(one);
                        }
                    } else {
                        console.log('Fanpage não encontrada!');
                    }
                });
            }
            break;
        
        /* sync existing videos */
        case 'syncvids':
            RTU.syncExistingVideos();
            break;
        
        /* send welcome email */
        case 'welcome':
            if (process.argv.length >= 4) {
                var page_id = process.argv[3].toString();
                email.montarEmail(page_id, function(html, user_email) {
                    email.enviarEmail('Mob Your Life', 'nao-responder@mobyourlife.com.br', 'Bem-vindo ao Mob Your Life', html, user_email);
                });
            }
            break;
    }
}