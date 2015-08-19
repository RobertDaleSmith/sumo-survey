
var VoteCtrl = module.exports = {};

var db = require('../models');

var async = require('async');
var Sequelize = require('sequelize');
var uuid = require('node-uuid');

// Get next unanswered Question
VoteCtrl.getNextQuestion = function(req, res) {
	var u_id = req.session.token;
	var answered = [];
	var question = {};

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
					where: { question_id: Sequelize.col('question.id') },
					attributes: ['id', 'text', 'order']
				}],
				limit: 10,
				order: ['answers.order']
			}).then(function(questions) {

				var result = null;
				if(questions.length > 0) {
					var max = questions.length-1;
					var idx = Math.round(Math.random()*max);
					result=questions[idx].dataValues;
				}
				question = result;
				next();

			});

		},
		function(next){ 

			// Temp hack to patch a bug
			if(question.answers){
				if(question.answers.length <= 0){

					db.Answer.findAll({
						where: {question_id: question.id},
						attributes: ['id','text','order'],
						order: ['order']
					}).then(function(answers) {
						
						question.answers = answers;

						next();
						
					});

				}else next(); 

			}else next();
			
		},
	],function(){
		
		//Render single qurstion survey form.
		res.render( 'index/survey', {
            question: question
        });

	});
};

// Cast Vote for an Answer and get next unanswered Question
VoteCtrl.submitVote = function(req, res) {
	var _id = uuid.v4();
	var a_id = req.body._id || null;
	var q_id = req.body.q_id || "";
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
			req.session.save(function (err) {
	            res.redirect('/');
	        });

		});

	}else{
		res.send({'status':'error'});
	}
};
