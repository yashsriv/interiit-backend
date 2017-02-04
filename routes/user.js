var express = require('express');
var router = express.Router();
var User = require('../models/users.js');
var Config = require('../config/hidden.js');
var querystring = require('querystring');
var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt-nodejs');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'interiittech2017@gmail.com',
    pass: 'kanpurjeetega'
  }
});
var mailOptions = {
  from: '"Inter IIT 2017" <interiittech2017@gmail.com>',
  to: '',
  subject: 'Password Reset',
  text: '',
  html: ''
};

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
    .get('/logout', isLoggedIn, function(req, res) {
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
    })
    .post('/forgot', function(req, res) {
      User.find({username: req.body.username}, function(error, user) {
        if (error) {
          res.sendStatus(500);
        } else if (user.length !== 0) {
          console.log(user[0]);
          mailOptions.to = user[0].email;
          var timestamp = Date.now();
          var hash = user[0].username + ":" + timestamp + ":" + Config.password;
          var hashed = user[0].generateHash(hash);
          var link = 'http://interiit.tech/reset?' + querystring.stringify({
            username: user[0].username,
            timestamp: timestamp,
            auth: hashed
          });
          mailOptions.text = 'Please click on the following link to restore your password:\n';
          mailOptions.text += link;
          mailOptions.html = 'Please click on the following link to restore your passord: <br>';
          mailOptions.html += '<a href="' + link + '"> Reset Password </a>';
          transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
              console.log(error);
              res.sendStatus(500);
            } else {
              res.sendStatus(200);
            }
          });
        } else {
          res.sendStatus(404);
        }
      });
    })
    .post('/reset', function(req, res) {
      User.find({username: req.body.username}, function(error, user) {
        if (error) {
          res.sendStatus(501);
        } else if (user.length !== 0) {
          var hash = user[0].username + ':' + req.body.timestamp + ':' + Config.password;
          if (bcrypt.compareSync(hash, req.body.auth)) {
            user[0].password = user[0].generateHash(req.body.password);
            user[0].save(function(err) {
              if (err) {
                res.sendStatus(501);
              } else {
                res.sendStatus(202);
              }
            });
          } else {
            res.sendStatus(406);
          }
        } else {
          res.sendStatus(404);
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
