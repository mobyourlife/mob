// app/models/domain.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var feedSchema = mongoose.Schema({
    _id: String,
    ref: { type: String, ref: 'Fanpage' },
    time: Date,
    story: String,
    picture: String,
    source: String,
    link: String,
    type: String,
    name: String,
    caption: String,
    description: String,
    message: String,
    object_id: String,
    cdn: String
});

// export user model
module.exports = mongoose.model('Feed', feedSchema);