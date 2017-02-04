var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/users.js');
var colleges = require('./colleges.js');

module.exports = function(passport) {

  var options = {
    usernameField: "username",
    passwordField: "password",
    passReqToCallback: true
  };

  passport.serializeUser(function(user, done) {
    // Return unique identification of the user
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    // findbyid and return user
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  var signIn = function(req, username, password, done) {
    process.nextTick(function() {
      User.findOne({ username: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!user.validPassword(password)) { return done(null, false); }
        return done(null, user);
      });
    });
  };

  var signUp = function(req, username, password, done) {
    process.nextTick(function() {
      User.findOne({ username: username }, function(err, user) {
        if (err) { return done(err); }
        if (user) { return done(err, null); }
        var nuser = new User();
        nuser.username = username;
        nuser.password = nuser.generateHash(password);
        if (!req.body.name) {
          return done("No Name Sent");
        }
        nuser.name = req.body.name;
        if (!req.body.email) {
          return done("No Email Sent");
        }
        nuser.email = req.body.email;
        if (!req.body.gender || (req.body.gender !== "M" && req.body.gender !== "F" && req.body.gender !== "O")) {
          return done("No Gender Sent");
        }
        nuser.gender = req.body.gender;
        if (!req.body.phone) {
          return done("No number sent");
        }
        nuser.phone = req.body.phone;
        if (colleges.indexOf(req.body.college) !== -1) {
          nuser.college = req.body.college;
          return nuser.save(function(error) {
            return done(error, nuser);
          });
        } else {
          return done("Invalid college name");
        }
      });
    });
  };

  passport.use('local-signin', new LocalStrategy(options, signIn));
  passport.use('local-signup', new LocalStrategy(options, signUp));

};
