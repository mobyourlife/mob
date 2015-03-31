var Ticket = require('../models/ticket');

// app/models/fanpage.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var fanpageSchema = mongoose.Schema({
    _id: String,
    theme: {
        css: String,
        navbar: String
    },
    cover: {
        path: String,
        height: Number
    },
    facebook: {
        id: String,
        name: String,
        about: String,
        description: String,
        picture: String,
        cdn: String,
        category: String,
        category_list: [{
            _id: String,
            name: String
        }],
        is_verified: Boolean,
        link: String,
        website: String,
        emails: [String],
        stats: {
            checkins: Number,
            likes: Number,
            talking_about_count: Number,
            were_here_count: Number
        },
        place: {
            name_with_location_descriptor: String,
            phone: String,
            location: {
                street: String,
                city: String,
                state: String,
                country: String,
                zip: String,
                coordinates: {type: [], index: '2d'}
            },
            parking: {
                lot: Number,
                street: Number,
                valet: Number
            }
        },
        info: {
            general_info: String,
            hours: [String],
            impressum: String,
            band: {
                band_members: String,
                booking_agent: String,
                press_contact: String,
                hometown: String,
                record_label: String
            },
            company: {
                company_overview: String,
                founded: String,
                mission: String
            },
            film: {
                directed_by: String
            },
            foodnight: {
                attire: String,
                general_manager: String,
                price_range: String,
                restaurant: {
                    services: {
                        kids: Boolean,
                        delivery: Boolean,
                        walkins: Boolean,
                        catering: Boolean,
                        reserve: Boolean,
                        groups: Boolean,
                        waiter: Boolean,
                        outdoor: Boolean,
                        takeout: Boolean
                    },
                    specialties: {
                        coffee: Boolean,
                        drinks: Boolean,
                        breakfast: Boolean,
                        dinner: Boolean,
                        lunch: Boolean
                    }
                }
            },
            personality: {
                birthday: Date
            },
            payment_options: {
                amex: Boolean,
                cash_only: Boolean,
                discover: Boolean,
                mastercard: Boolean,
                visa: Boolean
            }
        }
    },
    creation: {
        time : Date,
        user : { type: String, ref: 'User' }
    },
    billing: {
        active: Boolean,
        evaluation: Boolean,
        expiration: Date
    },
    video_count: Number
});

// export user model
module.exports = mongoose.model('Fanpage', fanpageSchema);