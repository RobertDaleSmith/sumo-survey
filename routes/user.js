var express = require('express');
var router = express.Router();

var async = require('async');
var Sequelize = require('sequelize');
var uuid = require('node-uuid');

var db = require('../models');

// User middleware
function checkUser(req, res, next) {
	//Checks for token ID and if user exists, generates new user if none and returns UUID as token.
	var token = req.session.token || null;
	
	// No token found, generate new User.
	if(!token){
	
		var _id = uuid.v4();
		
		req.session.token = _id;

		db.User.create({
			id: _id,
			email: null
		}).then(function(user){
			next();
		});

	}else{

		next();

	}

}

// Get next unanswered Question
router.get('/', checkUser, function( req, res, next ) {

	var u_id = req.session.token;
	var answered = [];

	async.series([	
		// Gets user's answered question ids.
		function(next){ 

			db.Vote.findAll({
				where: {user_id: u_id},
				attributes: ['q_id']
			}).then(function(votes) {
				
				var results = [];
				votes.forEach(function(vote){
					if(vote.dataValues) results.push(vote.dataValues.q_id);
				});

				if(results.length<1) answered = null;
				else answered = results;

				next();
			});
			
		},
		function(next){ 

			// Gets random question unanswered by user.
			db.Question.findAll({
				where: { id: { not: answered } },
				attributes: ['id', 'text'],
				include: [{
					model: db.Answer,
					required: false,
					where: { questionId: Sequelize.col('question.id') },
					attributes: ['id', 'text', 'order']
				}],
				limit: 10,
				order: ['answers.order']
			}).then(function(questions) {

				var result = {};
				if(questions.length > 0) {
					var max = questions.length-1;
					var idx = Math.round(Math.random()*max);
					result=questions[idx].dataValues;
				}
				res.send(result);

			});

		}
	],function(){

		res.send({'status':'voted'});

	});
	
});

// Cast Vote for an Answer and get next unanswered Question
router.post('/survey', checkUser, function( req, res, next ) {

	var _id = uuid.v4();
	var a_id = req.query._id || null;
	var q_id = req.query.q_id || "";
	var u_id = req.session.token || null;

	if(a_id && u_id) {

		async.series([
			function(next){ 

				// Gets Answer's Question's id.
				db.Answer.findOne({
					where: {id: a_id},
					attributes: ['question_id']
				}).then(function(answer) {
					q_id = answer.question_id;
					next();
				});
				
			},
			function(next){ 

				// Check if Question has existing vote from this User.
				db.Vote.findOne({
					where: {q_id: q_id, user_id: u_id },
					attributes: ['id']
				}).then(function(vote) {

					if(vote) vote=vote.dataValues;

					if(vote){
						next('already voted');
					}else{
						next();	
					}
					
				});
				
			},
			function(next){ 

				// Creates Vote associated User, for a Question's Answer 
				db.Vote.create({
					id: _id,
					user_id: u_id,
					a_id: a_id,
					q_id: q_id
				}).then(function(vote){
					next();
				});
				
			},
			function(next){ 

				// Increments Answer's vote count.
				db.Answer.update({
					count: Sequelize.literal('count + 1')
				},{
					where: {id: a_id},
					attributes: ['question_id']
				}).then(function(){
					next();
				});

			}
		],function(err){

			var status = err || 'voted';
			res.send({'status':status});

		});

	}else{
		res.send({'error':true});
	}

});

module.exports = router;
