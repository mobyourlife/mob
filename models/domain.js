// app/models/domain.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var domainSchema = mongoose.Schema({
    _id: String,
    ref: { type: Schema.Types.ObjectId, ref: 'Fanpage' },
    status: String,
    registrar: String,
    expiration: Boolean,
    creation: {
        time : Date,
        user : { type: Schema.Types.ObjectId, ref: 'User' }
    }
});

// export user model
module.exports = mongoose.model('Domain', domainSchema);