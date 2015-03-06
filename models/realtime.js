// app/models/realtime.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var realtimeUpdateSchema = mongoose.Schema({
    time: Date,
    updated: Boolean,
    data: Object,
    error_msg: String,
    error_time: Date,
    error_token: String
});

// export realtime update model
module.exports = mongoose.model('RealtimeUpdate', realtimeUpdateSchema);