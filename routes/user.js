
var express = require('express');
var router = express.Router();

var UserCtrl = require('../controller/UserCtrl.js');
var VoteCtrl = require('../controller/VoteCtrl.js');

// User middleware
function requireUser(req, res, next) {
	//Checks for token ID and if user exists, generates new user if none and returns UUID as token.
	var token = req.session.token || null;
	
	// No token found, generate new User.
	if(!token){
				
		UserCtrl.addUser(function(user){
			console.log(user.id);
			req.session.token = user.id;
			next();

		});

	}else{

		next();

	}
};

// Get next unanswered Question
router.get('/', requireUser, VoteCtrl.getNextQuestion);

// Cast Vote for an Answer and get next unanswered Question
router.post('/vote', requireUser, VoteCtrl.submitVote);


module.exports = router;
