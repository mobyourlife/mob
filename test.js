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
                realtime.setSubscription('page', 'feed, name, picture, category, description, founded, company_overview, conversations, mission, products, general_info, location, hours, parking, public_transit, phone, email, website, attire, payment_options, culinary_team, general_manager, price_range, restaurant_services, restaurant_specialties, videos, release_date, genre, starring, screenplay_by, directed_by, produced_by, studio, awards, plot_outline, network, season, schedule, written_by, band_members, hometown, current_location, record_label, booking_agent, press_contact, artists_we_like, influences, band_interests, bio, affiliation, birthday, personal_info, personal_interests, members, built, features, mpg, checkins, productlists', function(ret) {
                    console.log('setSubscription:');
                    console.log(ret);
                });
                realtime.setSubscription('user', 'about, about_me, activities, birthday, birthday_date, books, checkins, contact_email, current_location, email, email_hashes, events, feed, first_name, friends, has_added_app, hometown, hometown_location, interests, is_app_user, is_blocked, last_name, likes, link, locale, location, movies, music, name, photos, pic, picture, political_views, profile_blurb, profile_update_time, profile_url, proxied_email, quotes, timezone, television, tv, videos, website', function(ret) {
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
                });
            });
            break;
    }
}