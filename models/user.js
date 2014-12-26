// app/models/user.js
// load dependencies
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the model schema
var userSchema = mongoose.Schema({
    facebook: {
        id : String,
        token : String,
        email : String,
        name : String
    }
});

// methods
// generate a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// validate password
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// export user model
module.exports = mongoose.model('User', userSchema);