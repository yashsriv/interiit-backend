var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
  username: {type: String, unique: true, default: ''},
  password: {type: String, default: ''},
  college: {type: String},
  name: {type: String},
  email: {type: String},
  phone: {type: String},
  gender: {type: String},
  eventsRegistered: [],
  isAdmin: {type: Boolean, default: false}
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
