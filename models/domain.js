// app/models/domain.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var domainSchema = mongoose.Schema({
    _id: String,
    ref: { type: String, ref: 'Fanpage' },
    status: String,
    registrar: String,
    expiration: Boolean,
    creation: {
        time : Date,
        user : { type: String, ref: 'User' }
    },
    routes: [String]
});

// export user model
module.exports = mongoose.model('Domain', domainSchema);