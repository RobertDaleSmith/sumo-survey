
var QuestionCtrl = module.exports = {};

var db = require('../models');

var Sequelize = require('sequelize');
var uuid = require('node-uuid');


// Get a Question and it's Answers
QuestionCtrl.getQuestion = function(req, res) {
    var _id = req.query._id || null;

    if(_id){

        db.Question.findOne({
            where: {
                id: _id
            },
            include: [{
                model: db.Answer,
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
};

// Add a Question
QuestionCtrl.addQuestion = function(req, res) {
    var _id = uuid.v4();
    var text = req.query.text || "";

    if(text!=""){

        db.Question.create({
            id: _id,
            text: text
        }).then(function(question){
            res.send(question);
        });

    }else{
        res.send({'error':true});
    }
};

// Remove a Question and it's Answers
QuestionCtrl.removeQuestion = function(req, res) {
    var _id = req.query._id || "";

    if(_id!=""){

        db.Question.destroy({
            where: { id: _id }
        }).then(function(question){
            res.send({'status':'deleted'});
        });

    }else{
        res.send({'error':true});
    }
};

// Get all Questions with Answers
QuestionCtrl.listQuestions = function(req, res) {

    db.Question.findAll({
        include: [{
            model: db.Answer,
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
};
