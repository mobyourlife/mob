// app/models/textpage.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var textPageSchema = mongoose.Schema({
    ref: { type: String, ref: 'Fanpage' },
    path: String,
    title: String,
    body: String
});

// export user model
module.exports = mongoose.model('TextPage', textPageSchema);