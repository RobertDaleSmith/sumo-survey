
var models = module.exports = {};

var AdminCtrl = require('../controller/AdminCtrl.js');
var config = require('../config.json');
var Sequelize = require('sequelize');


// init database
var sequelize = new Sequelize(config.mysql.schema, config.mysql.username, config.mysql.password, {
	host: config.mysql.host,
	dialect: 'mysql',
	logging: function(event){
		if(event.indexOf("sessions") < 0){
			console.log(event);
		}
	},
	pool: {
		max: 40,
		min: 0,
		idle: 10
	}
});

// syncs db tables, adds table if new
var syncTables = function(ready){
	models.sequelize.sync(config.mysql.options).then(function(){

		// init admin if none
		AdminCtrl.checkAdmin();

		// tables synced and DB ready for action
		ready();
	});
}

// define models
models.sequelize = sequelize;
models.sync = syncTables;
models.Admin = sequelize.import('./Admin.js');
models.Answer = sequelize.import('./Answer.js');
models.Question = sequelize.import('./Question.js');
models.User = sequelize.import('./User.js');
models.Vote = sequelize.import('./Vote.js');

// model associations
models.Question.hasMany(models.Answer, {onDelete: 'cascade'});
models.Answer.belongsTo(models.Question, {onDelete: 'cascade'});

models.User.hasMany(models.Vote, {onDelete: 'cascade', hooks: true});
models.Vote.belongsTo(models.User, {onDelete: 'cascade', hooks: true});
