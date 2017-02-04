var mongoose = require('mongoose');

var eventSchema = mongoose.Schema({
  name: { type: String, unique: true },
  teams: []
});

module.exports = mongoose.model('Event', eventSchema);
