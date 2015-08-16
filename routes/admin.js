var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs'); 
var uuid = require('node-uuid');
var Sequelize = require('sequelize');

var db = require('../models');

function checkAdmin(req, res, next) {

	if( req.session.admin && req.session.loggedIn ){
		next();
	}else{
		res.status(403);
		res.send({success:false, error:'Not logged in'});
	}

}

// Admin interface
router.get( '/admin', function( req, res, next ) {

	if(req.session.loggedIn){
		res.send({'status':'loggedIn'});
	}else {
		res.send({'status':'loggedOut'});
	}
	
});

// Admin log-in post
router.post( '/admin', function( req, res, next ) {

	var user = req.body['admin'];
	var username = user.username || "";
	var password = user.password || "";
	var remember = user.remember || false;

	function loginSuccess(result){
		result.password = null;
		req.session.admin = result;
		req.session.loggedIn = true;
		if (user.remember) { req.session.cookie.maxAge = 2628000000; }
		else { req.session.cookie.maxAge = 24*60*60*1000; }

		req.session.save(function (err) {
			res.redirect('/admin');
		});
		
	}

	db.Admin.findOne({
		where: {username: username},
		attributes: ['username', 'password']
	}).then(function(admin) {

		if(admin)admin=admin.dataValues;

		if(admin){

			if(bcrypt.compareSync(password, admin.password)){

				loginSuccess(admin);
				// res.send({'status':'success'});

			} else {
				res.send({'error':false}); // Password invalid.
			}
				
		} else {
			res.send({'error':true}); // User not found.
		}
		

	});

});

// Admin log-out
router.get( '/admin/logout', function( req, res, next ) {

	req.session.admin = null;
	req.session.loggedIn = false;
	req.session.save(function (err) {
		res.redirect('/admin');
	});

});

// Get all Questions with Answers
router.get('/questions', checkAdmin, function( req, res, next ) {

	db.Question.findAll({
		include: [{
			model: db.Answer,
			required: false,
			where: { questionId: Sequelize.col('question.id') }
		}],
		order: ['created_at', 'answers.order']
	}).then(function(questions) {

		var results = [];

		// console.log(questions);

		questions.forEach(function(question){
			results.push(question.dataValues);
		});

		res.send(results);

	});

});

// Get a Question and it's Answers
router.get('/question', checkAdmin, function( req, res, next ) {

	var _id = req.query._id || null;

	if(_id){

		db.Question.findOne({
			where: {
				id: _id
			},
			include: [{
				model: db.Answer,
				required: false,
				where: { questionId: Sequelize.col('question.id') }
			}],
			order: ['answers.order']
		}).then(function(question){
			var result = question || {};
			res.send(question);
		});

	}else{
		res.send({'error':true});
	}

});

// Add a Question
router.post('/question', checkAdmin, function( req, res, next ) {

	var _id = uuid.v4();
	var text = req.query.text || "";

	if(text!=""){

		db.Question.create({
			id: _id,
			text: text
		}).then(function(question){
			res.send(question);
		});

	}else{
		res.send({'error':true});
	}

});

// Remove a Question and it's Answers
router.delete('/question', checkAdmin, function( req, res, next ) {

	var _id = req.query._id || "";

	if(_id!=""){

		db.Question.destroy({
			where: { id: _id }
		}).then(function(question){
			res.send({'status':'deleted'});
		});

	}else{
		res.send({'error':true});
	}

});

// Get an Answer
router.get('/answer', checkAdmin, function( req, res, next ) {

	var _id = req.query._id || null;

	if(_id){

		db.Answer.findOne({
			where: {
				id: _id
			}
		}).then(function(answer){
			var result = answer || {};
			res.send(result);
		});

	}else{
		res.send({'error':true});
	}

});

// Add an Answer to a Question
router.post('/answer', checkAdmin, function( req, res, next ) {

	var _id = uuid.v4();
	var text = req.query.text || "";
	var q_id = req.query.q_id || null;
	var order = req.query.order || 0;

	if(q_id && text!=""){

		db.Answer.create({
			id: _id,
			question_id: q_id,
			text: text,
			order: order,
			count: 0
		}).then(function(answer){
			res.send(answer);
		});

	}else{
		res.send({'error':true});
	}

});

// Remove an Answer
router.delete('/answer', checkAdmin, function( req, res, next ) {

	var _id = req.query._id || "";

	if(_id!=""){

		db.Answer.destroy({
			where: { id: _id }
		}).then(function(answer){
			res.send({'status':'deleted'});
		});

	}else{
		res.send({'error':true});
	}

});

module.exports = router;
