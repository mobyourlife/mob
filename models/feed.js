// app/models/domain.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var feedSchema = mongoose.Schema({
    _id: String,
    ref: { type: Schema.Types.ObjectId, ref: 'Fanpage' },
    time: Date,
    story: String,
    picture: String,
    source: String,
    link: String,
    type: String,
    name: String,
    caption: String,
    description: String,
    object_id: String
});

// export user model
module.exports = mongoose.model('Feed', feedSchema);