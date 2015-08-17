
var AnswerCtrl = module.exports = {};

var db = require('../models');

var uuid = require('node-uuid');



// Get an Answer
AnswerCtrl.getAnswer = function(req, res) {
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
};

// Add an Answer to a Question
AnswerCtrl.addAnswer = function(req, res) {
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
};

// Remove an Answer
AnswerCtrl.removeAnswer = function(req, res) {
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
};
