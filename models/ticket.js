// app/models/domain.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var ticketSchema = mongoose.Schema({
    ref: { type: Schema.Types.ObjectId, ref: 'Fanpage' },
    time: Date,
    validity: {
        months: Number,
        days: Number
    },
    coupon: {
        reason: String
    },
    payment: {
        value: Number,
        code: String,
        time: Date
    }
});

// export ticket model
module.exports = mongoose.model('Ticket', ticketSchema);