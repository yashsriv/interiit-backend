var express = require('express');
var router = express.Router();
var events = require('../config/events');
var User = require('../models/users.js');
var Events = require('../models/events.js');

router.get('/', isLoggedIn, function(req, res) {
  res.json(events);
});

router.get('/csv', isAdmin, function(req, res) {
  Events.find({}, function(err, eventarray) {
    if (err) {
      res.sendStatus(501);
    } else {
      var csv = 'event,team-leader,college,members\n';
      for(var i = 0; i < eventarray.length; i++) {
        for(var j = 0; j < eventarray[i].teams.length; j++) {
          csv += eventarray[i].name + ',' + eventarray[i].teams[j].leader;
          csv += ',' + eventarray[i].teams[j].college + ',' + eventarray[i].teams[j].members + '\n';
        }
      }
      res.type('text/csv');
      res.set('Content-Disposition', 'inline; filename="teams.csv"');
      res.send(csv);
    }
  });
});

router.get('/admin', isAdmin, function(req, res) {
  Events.find({}, function(err, eventarray) {
    if (err) {
      res.sendStatus(501);
    } else {
      res.json(eventarray);
    }
  });
});

router.post('/register', isLoggedIn, function(req, res) {
  var event = req.body.event;
  var members = req.body.members;
  if (!members || members.length <= 0) {
    res.sendStatus(400);
    return;
  }
  var college = req.user.college;
  if (events.indexOf(event) !== -1) {
    User.find({}, function(err, users) {
      var findFunction = function(requiredName) {
        return function(user) {
          return user.username === requiredName;
        };
      };
      // Check all usernames are valid to prevent trolling
      for (var i = 0; i < members.length; i++) {
        var index = users.findIndex(findFunction(members[i]));
        if (index == -1) {
          res.status(400).json("All users are not registered");
          return;
        }
        if (!college) {
          college = users[index].college;
        } else if (users[index].college !== college) {
          res.status(400).json("All users don't have the same college");
          return;
        }
        users[index].eventsRegistered.push(event);
        users[index].save();
      }
      if (members.findIndex(findFunction(req.user.username)) === -1) {
        var index1 = users.findIndex(findFunction(members[i]));
        users[index1].eventsRegistered.push(event);
        users[index1].save();
      }
      Events.find({
        "name": event
      }, function(err, ev) {
        if (err) { res.sendStatus(501); return; }
        if (ev.length !== 0) {
          ev[0].teams.push({
            leader: req.user.username,
            college: college,
            members: members
          });
          ev[0].save(function(error) {
            if (error) {
              res.sendStatus(501);
            } else {
              res.sendStatus(202);
            }
          });
        } else {
          var nev = new Events();
          nev.name = event;
          nev.teams = [];
          nev.teams.push({
            leader: req.user.username,
            college: college,
            members: members
          });
          nev.save(function(error) {
            if (error) {
              res.sendStatus(501);
            } else {
              res.sendStatus(202);
            }
          });
        }
      });
    });
  } else {
    res.sendStatus(400);
  }
});

module.exports = router;

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
