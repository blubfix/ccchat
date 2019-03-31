/**
 * CC Chat by Laurin Obermaier and Felix Welker, 762582 and 762600
 */

var express = require('express');
var cons = require('consolidate');
var favicon = require('serve-favicon');
var path = require('path');

var index = require('./routes/index');

var app = express();

// view engine setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

module.exports = app;