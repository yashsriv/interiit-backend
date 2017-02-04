var bodyParser = require('body-parser');
var connectMongo = require('connect-mongo');
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var app = express();
var port = process.env.PORT || 3000;
var mongostore = connectMongo(session);

mongoose.connect("mongodb://localhost:27017/Inter-IIT");
require('./config/passport')(passport);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true  }));
app.use(session({
  secret: 'InterIITTechMeet17',
  resave: true,
  saveUninitialized: true,
  store: new mongostore({
     mongooseConnection: mongoose.connection
  })
}));
app.use(passport.initialize());
app.use(passport.session());

var users_route = require('./routes/user.js')(passport);
app.use('/user', users_route);
var events_route = require('./routes/events.js');
app.use('/events', events_route);
app.get('/colleges', function(req, res) {
  res.json(require('./config/colleges.js'));
});

//app.use(express.static('../inter-iit-frontend/techmeet'));

app.listen(port, function () {
  console.log('Example app listening on port ' + port + '!');
});
