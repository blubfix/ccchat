/**
 * CC Chat by Laurin Obermaier and Felix Welker, 762582 and 762600
 */

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next){
  res.render('index')
});


module.exports = router;