// app/models/fanpage.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var fanpageSchema = mongoose.Schema({
    facebook: {
        id: String,
        name: String,
        about: String,
        description: String,
        link: String,
        picture: String,
        category: String,
        category_list: [{
            id: String,
            name: String
        }],
        likes: Number,
        phone: String,
        location: {
            city: String,
            country: String,
            street: String,
            zip: String,
            coordinates: {type: [], index: '2d'}
        },
        parking: {
            lot: Number,
            Street: Number,
            valet: Number
        }
    },
    photos: [{
        id: String,
        source: String
    }],
    creation: {
        time : { type: Date },
        user : { type: Schema.Types.ObjectId, ref: 'User' }
    },
    owners: [{ type: Schema.Types.ObjectId, ref: 'Owner' }]
});

// export user model
module.exports = mongoose.model('Fanpage', fanpageSchema);