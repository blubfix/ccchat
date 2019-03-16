var express = require('express');
var cons = require('consolidate');
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var index = require('./routes/index');

var app = express();

// view engine setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use('/', index);

io.on('connection', function(socket){
    socket.on('chat message', function(msg){
      io.emit('chat message', msg);
    });
  });

module.exports = app;