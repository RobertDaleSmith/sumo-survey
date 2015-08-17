
var AdminCtrl = module.exports = {};

var config = require('../config.json');
var db = require('../models');

var bcrypt = require('bcrypt-nodejs'); 
var uuid = require('node-uuid');


// Admin interface
AdminCtrl.adminDash = function(req, res) {
    if(req.session.loggedIn){
        res.send({'status':'loggedIn'});
    }else {
        res.send({'status':'loggedOut'});
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
                // res.send({'status':'success'});

            } else {
                res.send({'error':false}); // Password invalid.
            }
                
        } else {
            res.send({'error':true}); // User not found.
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
