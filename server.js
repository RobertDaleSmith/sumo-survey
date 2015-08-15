/* 	┈┈┈┈┈SUMOSURVEY┈┈┈┈┈
	┈┈┈┈┈╭╯╭╯╭╯╭╯╭╯┈┈┈┈┈
	┈┈┈╱▔▔▔▔▔▔▔▔▔▔╲▔╲┈┈┈
	┈┈╱┈┈┈╭╮┈┈╭╮┈┈┈╲╮╲┈┈
	┈┈▏┈▂▂▂▂▂▂▂▂▂▂┈▕╮▕┈┈
	┈┈▏┈╲▂▂▂▂▂▂▂▂╱┈▕╮▕┈┈
	┈┈╲▂▂▂▂▂▂▂▂▂▂▂▂▂╲╱┈┈
	┈┈FREE┈TACO┈SURVEY┈┈  */


// get dependencies
var async = require('async');
var bodyParser = require('body-parser');
var cons = require('consolidate');
var dust = require('dustjs-linkedin');
	dust.helper = require('dustjs-helpers');
var express = require('express');
var multer = require('multer');
var mysql = require('mysql');
var Sequelize = require('sequelize');
var uuid = require('node-uuid');


// init app
var app = express();
var config = require('./config.json');
var port = config.port || 8080;
var db, Admin, Guest, Question, Answer;

app.set('port', port);
app.use(express.static(__dirname + '/public', {redirect: false}));
app.set('template_engine', 'dust');
app.set('view engine', 'dust');
app.engine('dust', cons.dust);
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(multer({dest:'./uploads/'}).single('singleInputFileName'));


// init database
db = new Sequelize(config.mysql.schema, config.mysql.username, config.mysql.password, {
	host: config.mysql.host,
	dialect: 'mysql',
	pool: { max: 5, min: 0, idle: 100 }
});


// define models
Admin = db.define('admin', {
	username: Sequelize.STRING,
	password: Sequelize.STRING
},{	freezeTableName: true });

Guest = db.define('guest', {
	_id: Sequelize.STRING,
	name: { type: Sequelize.STRING, allowNull: false },
	email: { type: Sequelize.STRING, allowNull: false }
},{	freezeTableName: true });

Answer = db.define('answer', {
	id: {
      type: Sequelize.UUID,
      primaryKey: true
    },
	text: Sequelize.STRING,	
	order: Sequelize.INTEGER,
	count: Sequelize.INTEGER
},{	freezeTableName: true, underscored: true });

Question = db.define('question', {
	id: {
      type: Sequelize.UUID,
      primaryKey: true
    },
	text: Sequelize.STRING,
},{	freezeTableName: true, underscored: true });


// model associations
Question.hasMany(Answer, { foreignKeyConstraint: true, onDelete: 'cascade', hooks: true });
Answer.belongsTo(Question, { foreignKeyConstraint: true, onDelete: 'cascade', hooks: true });


// sync tables
async.parallel(
	[
		function(next){ Admin.sync(config.mysql.options).then(next);	},
		function(next){ Guest.sync(config.mysql.options).then(next);	},
		function(next){ Answer.sync(config.mysql.options).then(next);	},		
		function(next){ Question.sync(config.mysql.options).then(next);	}
	], 
	function(){

		console.log("\n--- DB READY ---\n");

		// init an admin
		Admin.create(config.admin);

// routes
	
		app.get('/survey', function( req, res, next ) {

			Question.findAll({
				attributes: ['id', 'text'],
				include: [{
					model: Answer,
					required: false,
					where: { questionId: Sequelize.col('question.id') },
					attributes: ['id', 'text', 'order']
				}],
				limit: 1,
				order: ['created_at', 'answers.order']
			}).then(function(questions) {

				var result = {};

				if(questions.length > 0) result=questions[0].dataValues;
				
				res.send(result);

			});

		});

// admin routes
		
		// Admin interface
		app.get( '/admin', function( req, res, next ) {
			res.send({'status':'admin'});
		});

		// Admin token request
		app.post( '/admin/signin', function( req, res, next ) {

			var username = req.body.username || "";
			var password = req.body.password || "";

			Admin.findOne({
				where: {username: username},
				attributes: ['username', 'password']
			}).then(function(admin) {

				if(admin) admin=admin.dataValues;

				if(admin && admin.password==password){

					// Add new guest to DB.

					// Generate JWT containing guest's id.

					res.send({'status':'success'});

				} else {
					res.send({'error':true});
				}

			});

		});



		// Get all Questions with Answers
		app.get('/questions', function( req, res, next ) {

			Question.findAll({
				include: [{
					model: Answer,
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
		app.get('/question', function( req, res, next ) {

			var _id = req.query._id || null;

			if(_id){

				Question.findOne({
					where: {
						id: _id
					},
					include: [{
						model: Answer,
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
		app.post('/question', function( req, res, next ) {

			var _id = uuid.v4();
			var text = req.query.text || "";

			if(text!=""){

				Question.create({
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
		app.delete('/question', function( req, res, next ) {

			var _id = req.query._id || "";

			if(_id!=""){

				Question.destroy({
					where: { id: _id }
				}).then(function(question){
					res.send({'status':'success'});
				});

			}else{
				res.send({'error':true});
			}

		});




		// Get an Answer
		app.get('/answer', function( req, res, next ) {

			var _id = req.query._id || null;

			if(_id){

				Answer.findOne({
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
		app.post('/answer', function( req, res, next ) {

			var _id = uuid.v4();
			var text = req.query.text || "";
			var q_id = req.query.q_id || null;
			var order = req.query.order || 0;

			if(q_id && text!=""){

				Answer.create({
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
		app.delete('/answer', function( req, res, next ) {

			var _id = req.query._id || "";

			if(_id!=""){

				Answer.destroy({
					where: { id: _id }
				}).then(function(answer){
					res.send({'status':'success'});
				});

			}else{
				res.send({'error':true});
			}

		});



		// 404 to root
		app.get( '*', function( req, res, next ) { res.redirect('/'); });
 
		// initializing a port
		app.listen(port);

	}

);
