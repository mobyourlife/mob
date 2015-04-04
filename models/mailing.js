// app/models/mailing.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var mailingSchema = mongoose.Schema({
    _id: String,
    ref: { type: String, ref: 'Fanpage' },
    email: String,
    opted: Boolean,
    optin: Date,
    optout: Date
});

// export mailing model
module.exports = mongoose.model('Mailing', mailingSchema);