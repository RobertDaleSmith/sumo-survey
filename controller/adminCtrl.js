
var AdminCtrl = module.exports = {};

var config = require('../config.json');
var db = require('../models');

var async = require('async');
var bcrypt = require('bcrypt-nodejs'); 
var Sequelize = require('sequelize');
var uuid = require('node-uuid');

var getStats = function(cb){

    var results = {
        users: 0,
        votes: 0,
        questions: 0,
        answers: 0
    }

    async.parallel([
        function(next){ 
            db.User.findAndCountAll().then(function(res) {
                results.users = res.count;
                next();
            });
        },
        function(next){ 
            db.Vote.findAndCountAll().then(function(res) {
                results.votes = res.count;
                next();
            });
        },
        function(next){ 
            db.Question.findAndCountAll().then(function(res) {
                results.questions = res.count;
                next();
            });
        },
        function(next){ 
            db.Answer.findAndCountAll().then(function(res) {
                results.answers = res.count;
                next();
            });
        }
    ],function(err){
        cb(results);
    });

}

// Admin interface
AdminCtrl.adminDash = function(req, res) {

    // Query real stats for dashboard.
    getStats(function(counts){
        // Renders Admin Dashboard page.
        res.render( 'admin/dash', {
            title:  'Dashboard',
            pageId: 'dash',
            admin: req.session.admin,
            counts: counts
        });
    });

};

// Admin log-in post
AdminCtrl.loginAdmin = function(req, res) {
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

            } else {

                // Password invalid.
                req.flash('error', 'Invalid Username or Password.');
                req.session.save(function (err) {
                    res.redirect('/admin');
                });

            }
                
        } else {

            // User not found.
            req.flash('error', 'Invalid Username or Password.');
            req.session.save(function (err) {
                res.redirect('/admin');
            });

        }
        

    });
};

// Admin log-out
AdminCtrl.logoutAdmin = function(req, res) {
    req.session.admin = null;
    req.session.loggedIn = false;
    req.session.save(function (err) {
        res.redirect('/admin');
    });
};


// Renders Edit Survey Questions page
AdminCtrl.renderQuestions = function(req, res) {
    db.Question.findAll({
        include: [{
            model: db.Answer,
            required: false,
            where: { question_id: Sequelize.col('question.id') }
        }],
        order: ['created_at', 'answers.order']
    }).then(function(questions) {

        var results = [];
        questions.forEach(function(question){
            results.unshift(question.dataValues);
        });

        res.render( 'admin/questions', {
            title:  'Questions',
            pageId: 'questions',
            admin: req.session.admin,
            questions: results
        });

    });
};

// Renders Reports page
AdminCtrl.renderReports = function(req, res) {
    
    res.render( 'admin/reports', {
        title:  'Reports',
        pageId: 'reports',
        admin: req.session.admin
    });

};


// Add admin
var addAdmin = function(name, pass) {

    var password = bcrypt.hashSync( pass, bcrypt.genSaltSync(10) );
    db.Admin.create({
        username: name, 
        password: password
    }).then(function(admin){
        return admin;
    });

};

// Adds default admin
AdminCtrl.checkAdmin = function() {
    db.Admin.findOne({
        where: {username: config.admin.username},
        attributes: ['username', 'password']
    }).then(function(admin) {
        if(!admin){
            // Default admin not found.
            addAdmin(config.admin.username, config.admin.password);
        }
    });
};
