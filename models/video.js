// app/models/video.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var videoSchema = mongoose.Schema({
    _id: String,
    ref: { type: String, ref: 'Fanpage' },
    time: Date,
    name: String,
    description: String,
    link: String
});

// export photo model
module.exports = mongoose.model('Video', videoSchema);