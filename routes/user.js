var express = require('express');
var router = express.Router();
var User = require('../models/users.js');
var Config = require('../config/hidden.js');

module.exports = function(passport) {
  return router.post('/login', passport.authenticate('local-signin'), function(req, res) { res.json(sanitize(req.user)); })
    .post('/signup', passport.authenticate('local-signup'), function(req, res) { res.json(sanitize(req.user)); })
    .get('/me', isLoggedIn, function(req, res) { res.json(sanitize(req.user)); })
    .get('/admin', isAdmin, function(req, res) {
      User.find({}, function(err, users) {
        if (err) {
          res.sendStatus(501);
        } else {
          res.json(users);
        }
      });
    })
    .post('/admin', function(req, res) {
      var admin = new User();
      admin.username = "admin";
      admin.password = admin.generateHash(Config.password);
      admin.college = "IIT Kanpur";
      admin.isAdmin = true;
      admin.save(function(error) {
        if (error) {
          res.sendStatus(501);
        } else {
          res.sendStatus(201);
        }
      });
    })
    .get('/', isLoggedIn, function(req, res) {
      User.find({}, function(err, users) {
        if (err) {
          res.sendStatus(501);
        } else {
          res.json(users
                   .filter(function(a) {
                     return a.college === req.user.college;
                   })
                   .map(function(a) { return a.username; }));
        }
      });
    })
    .get('/logout', isLoggedInn, function(req, res) {
      req.logout();
    })
    .get('/csv', isAdmin, function(req, res) {
      User.find({}, function(err, userarray) {
        if (err) {
          res.sendStatus(501);
        } else {
          var csv = 'username,college,name,email,phone,gender,events\n';
          for(var i = 0; i < userarray.length; i++) {
            csv += userarray[i].username + ',' + userarray[i].college;
            csv += ',' + userarray[i].name + ',' + userarray[i].email + ',';
            csv += userarray[i].phone + ',' + userarray[i].gender + ',';
            csv += userarray[i].eventsRegistered.join(':') + '\n';
          }
          res.type('text/csv');
          res.set('Content-Disposition', 'inline; filename="users.csv"');
          res.send(csv);
        }
      });
    });

};

function sanitize(user) {
  user.password = undefined;
  user._id = undefined;
  user.__v = undefined;
  user.isAdmin = undefined;
  return user;
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    next();
  else
    res.sendStatus(401);
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if(req.user.isAdmin)
      next();
    else
      res.sendStatus(403);
  } else {
    res.sendStatus(401);
  }
}
