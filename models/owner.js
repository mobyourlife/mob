// app/models/owner.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var ownerSchema = mongoose.Schema({
    user : { type: Schema.Types.ObjectId, ref: 'User' },
    fanpages: [{
        ref: { type: Schema.Types.ObjectId, ref: 'Fanpage' },
        token: String
    }]
});

// export user model
module.exports = mongoose.model('Owner', ownerSchema);