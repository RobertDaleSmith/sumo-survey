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
var bcrypt = require('bcrypt-nodejs'); 
var bodyParser = require('body-parser');
var cons = require('consolidate');
var dust = require('dustjs-linkedin');
	dust.helper = require('dustjs-helpers');
var express = require('express');
var expressSession = require('express-session');
var multer = require('multer');
var mysql = require('mysql');
var Sequelize = require('sequelize');
var Store = require('express-sequelize-session')(expressSession.Store);
var uuid = require('node-uuid');


// init app
var app = express();
var config = require('./config.json');
var port = config.port || 8080;
var db, Session, Admin, User, Vote, Question, Answer;

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


// init sessions
var store = new Store(db, 'session');
app.use(expressSession({
	name: 'sid',
	secret: 'MyAwesomeAppSessionSecret',
	store: store,
	resave: false,
	saveUninitialized: true
}));


// define models
Session = store.Session;

Admin = db.define('admin', {
	username: { type: Sequelize.STRING, unique: true},
	password: Sequelize.STRING
},{	freezeTableName: true });

User = db.define('user', {
	id: {
      type: Sequelize.UUID,
      primaryKey: true
    },
	email: { type: Sequelize.STRING, allowNull: true }
},{	freezeTableName: true, underscored: true });

Vote = db.define('vote', {
	id: {
      type: Sequelize.UUID,
      primaryKey: true
    },
    q_id: Sequelize.UUID,
    a_id: Sequelize.UUID
},{	freezeTableName: true, underscored: true });

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
Question.hasMany(Answer, { onDelete: 'cascade', hooks: true });
Answer.belongsTo(Question, { onDelete: 'cascade', hooks: true });

User.hasMany(Vote, { onDelete: 'cascade', hooks: true });
Vote.belongsTo(User, { onDelete: 'cascade', hooks: true });

// sync tables
async.parallel(
	[
		function(next){ db.sync(config.mysql.options).then(next); }
	], 
	function(){
		console.log("\n--- DB READY ---\n");

		// init an admin
		// checks for admin in db, if none then creates new with config.
		Admin.findOne({
			where: {username: config.admin.username},
			attributes: ['username', 'password']
		}).then(function(admin) {
			if(!admin){
				var password = bcrypt.hashSync( config.admin.password, bcrypt.genSaltSync(10) );
				Admin.create({username: config.admin.username, password: password});
			}
		});
		
		// middleware

			//Checks for token ID and if user exists, generates new user if none and returns UUID as token.
			function checkUser(req, res, next) {

				var token = req.session.token || null;
				
				// No token found, generate new User.
				if(!token){
				
					var _id = uuid.v4();
					
					req.session.token = _id;

					User.create({
						id: _id,
						email: null
					}).then(function(user){
						next();
					});

				}else{

					next();

				}

			}
			function checkAdmin(req, res, next) {

				if( req.session.admin && req.session.loggedIn ){
					next();
				}else{
					res.status(403);
					res.send({success:false, error:'Not logged in'});
				}

			}

		// public routes
			
			// Get next unanswered Question
			app.get('/survey', checkUser, function( req, res, next ) {

				var u_id = req.session.token;
				var answered = [];

				async.series([	
					// Gets user's answered question ids.
					function(next){ 

						Vote.findAll({
							where: {user_id: u_id},
							attributes: ['q_id']
						}).then(function(votes) {
							
							var results = [];
							votes.forEach(function(vote){
								if(vote.dataValues) results.push(vote.dataValues.q_id);
							});
							answered = results;
							next();
						});
						
					},
					function(next){ 

						// Gets random question unanswered by user.
						Question.findAll({
							where: { id: { not: answered } },
							attributes: ['id', 'text'],
							include: [{
								model: Answer,
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
				

				//TODO: If all answered, then request email.

			});

			// Cast Vote for an Answer and get next unanswered Question
			app.post('/survey', checkUser, function( req, res, next ) {

				var _id = uuid.v4();
				var a_id = req.query._id || null;
				var q_id = req.query.q_id || "";
				var u_id = req.session.token || null;

				if(a_id && u_id) {

					async.series([
						function(next){ 

							// Gets Answer's Question's id.
							Answer.findOne({
								where: {id: a_id},
								attributes: ['question_id']
							}).then(function(answer) {
								q_id = answer.question_id;
								next();
							});
							
						},
						function(next){ 

							// Check if Question has existing vote from this User.
							Vote.findOne({
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
							Vote.create({
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
							Answer.update({
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

			//TODO: Submit name/email route

		// admin routes
			
			//TODO: protect routes with JWT verified token.


			// Admin interface
			app.get( '/admin', function( req, res, next ) {

				if(req.session.loggedIn){
					res.send({'status':'loggedIn'});
				}else {
					res.send({'status':'loggedOut'});
				}
				
			});

			// Admin log-in post
			app.post( '/admin', function( req, res, next ) {

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

				Admin.findOne({
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
			app.get( '/admin/logout', function( req, res, next ) {

				req.session.admin = null;
				req.session.loggedIn = false;
				req.session.save(function (err) {
					res.redirect('/admin');
				});

			});


			// Get all Questions with Answers
			app.get('/questions', checkAdmin, function( req, res, next ) {

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
			app.get('/question', checkAdmin, function( req, res, next ) {

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
			app.post('/question', checkAdmin, function( req, res, next ) {

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
			app.delete('/question', checkAdmin, function( req, res, next ) {

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
			app.get('/answer', checkAdmin, function( req, res, next ) {

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
			app.post('/answer', checkAdmin, function( req, res, next ) {

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
			app.delete('/answer', checkAdmin, function( req, res, next ) {

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
