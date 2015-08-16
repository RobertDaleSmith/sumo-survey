const TAG = '[route]';
var express = require('express');
// var User = require('../models').User;

var router = express.Router();

router.use(require('./user.js'));

router.use(require('./admin.js'));

// catch 404 and redirects to root
router.use(function (req, res, next) {
    res.redirect('/');
});

module.exports = router;
