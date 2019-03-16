var express = require('express');
var cons = require('consolidate');
var path = require('path');

var index = require('./routes/index');

var app = express();

// view engine setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use('/', index);

module.exports = app;