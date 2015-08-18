
var UserCtrl = module.exports = {};

var db = require('../models');

var uuid = require('node-uuid');



// Get an User
UserCtrl.getUser = function(req, res) {
    var _id = req.query._id || null;

    if(_id){

        db.User.findOne({
            where: {
                id: _id
            }
        }).then(function(user){
            var result = user || {};
            res.send(result);
        });

    }else{
        res.send({'error':true});
    }
};

// Add an User
UserCtrl.addUser = function(cb) {
    var _id = uuid.v4();

    db.User.create({
        id: _id,
        email: null
    }).then(function(user){
        cb(user);
    });
};

// Remove an User
UserCtrl.removeUser = function(req, res) {
    var _id = req.query._id || "";

    if(_id!=""){

        db.User.destroy({
            where: { id: _id }
        }).then(function(user){
            res.send({'status':'deleted'});
        });

    }else{
        res.send({'error':true});
    }
};
