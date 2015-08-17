
var AdminCtrl = module.exports = {};

var config = require('../config.json');
var db = require('../models');
var bcrypt = require('bcrypt-nodejs'); 
var Sequelize = require('sequelize');
var uuid = require('node-uuid');


// Admin interface
AdminCtrl.adminDash = function(req, res) {

    if(req.session.loggedIn){

        //TODO: Query real stats for dashboard.

        // Renders Admin Dashboard page.
        res.render( 'admin/dash', {
            title:  'Dashboard',
            pageId: 'adminUsers',
            admin: req.session.admin
        });

    }else {
        
        // Renders Admin Login page
        res.render('admin/login', {
            title:  'Login',
            error: req.flash('error')
        });

    }

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
            where: { questionId: Sequelize.col('question.id') }
        }],
        order: ['created_at', 'answers.order']
    }).then(function(questions) {

        var results = [];
        questions.forEach(function(question){
            results.push(question.dataValues);
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
            addAdmin(config.admin.username, config.admin.password);
        }
    });
};
