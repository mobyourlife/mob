// app/models/photo.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var photoSchema = mongoose.Schema({
    _id: String,
    ref: { type: String, ref: 'Fanpage' },
    source: String,
    time: Date,
    cdn: String,
    name: String,
    album_id: { type: String, ref: 'Album' },
});

// export photo model
module.exports = mongoose.model('Photo', photoSchema);