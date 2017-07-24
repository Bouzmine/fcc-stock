'use strict';
var routes = require('./app/routes/index.js');
var session = require('express-session');
var fetch = require("node-fetch");

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
require('dotenv').load();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(session({
	secret: 'secretClementine',
	resave: false,
	saveUninitialized: true
}));

routes(app, io, fetch);

var port = process.env.PORT || 8080;
http.listen(port, function(){
  console.log('listening on *:3000');
});
