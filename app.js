/* 	┈┈┈┈┈SUMOSURVEY┈┈┈┈┈
	┈┈┈┈┈╭╯╭╯╭╯╭╯╭╯┈┈┈┈┈
	┈┈┈╱▔▔▔▔▔▔▔▔▔▔╲▔╲┈┈┈
	┈┈╱┈┈┈╭╮┈┈╭╮┈┈┈╲╮╲┈┈
	┈┈▏┈▂▂▂▂▂▂▂▂▂▂┈▕╮▕┈┈
	┈┈▏┈╲▂▂▂▂▂▂▂▂╱┈▕╮▕┈┈
	┈┈╲▂▂▂▂▂▂▂▂▂▂▂▂▂╲╱┈┈
	┈┈FREE┈TACO┈SURVEY┈┈  */

// get dependencies
var bcrypt = require('bcrypt-nodejs'); 
var bodyParser = require('body-parser');
var cons = require('consolidate');
var dust = require('dustjs-linkedin');
	dust.helper = require('dustjs-helpers');
var express = require('express');
var expressSession = require('express-session');
var flash = require('connect-flash');
var http = require('http');
var multer = require('multer');
var Store = require('express-sequelize-session')(expressSession.Store);

// init app
var app = express();
var config = require('./config.json');
var port = config.port || 8080;

app.set('port', port);
app.use(express.static(__dirname + '/public', {redirect: false}));
app.set('template_engine', 'dust');
app.set('view engine', 'dust');
app.engine('dust', cons.dust);
app.set('views', __dirname + '/views');
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(multer().single('singleInputFileName'));

// init models
var db = require('./models');

// init sessions
var store = new Store(db.sequelize, 'session');
app.use(expressSession({
	name: 'sid',
	secret: 'MyAwesomeAppSessionSecret',
	store: store,
	resave: false,
	saveUninitialized: true
}));

// init routes
var routes = require('./routes');
app.use('/', routes);

// init tables
db.sync(function(){

	console.log("\n--- DB READY ---\n");

	// init server
	var server = http.createServer(app);
	server.listen(port);

});
