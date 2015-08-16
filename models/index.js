var Sequelize = require('sequelize');
var config = require('../config.json');
var models = module.exports = {};

// init database
var sequelize = new Sequelize(config.mysql.schema, config.mysql.username, config.mysql.password, {
	host: config.mysql.host,
	dialect: 'mysql',
	pool: {
		max: 40,
		min: 0,
		idle: 10
	}
});

// define models
models.sequelize = sequelize;
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
