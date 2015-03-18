// app/models/album.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var albumSchema = mongoose.Schema({
    _id: String,
    ref: { type: String, ref: 'Fanpage' },
    name: String,
    path: String,
    time: Date,
    special: String
});

// export user model
module.exports = mongoose.model('Album', albumSchema);