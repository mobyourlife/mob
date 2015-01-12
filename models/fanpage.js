// app/models/fanpage.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var fanpageSchema = mongoose.Schema({
    facebook: {
        id : String,
        name : String,
        about : String,
        link : String,
        picture : String
    },
    creation: {
        time : { type: Date },
        user : { type: Schema.Types.ObjectId, ref: 'User' }
    },
    owners: [{ type: Schema.Types.ObjectId, ref: 'Owner' }]
});

// export user model
module.exports = mongoose.model('Fanpage', fanpageSchema);