// app/models/domain.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var domainSchema = mongoose.Schema({
    _id: String,
    ref: { type: Schema.Types.ObjectId, ref: 'Fanpage' }
});

// export user model
module.exports = mongoose.model('Domain', domainSchema);