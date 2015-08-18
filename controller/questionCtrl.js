
var QuestionCtrl = module.exports = {};

var db = require('../models');

var async = require('async');
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
                where: { question_id: Sequelize.col('question.id') }
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
    var q_id = uuid.v4();
    var text = req.body.text || "";

    var answers = req.body.answers || [];
    var order = 0;

    if(text!=""){

        async.series([
            function(next){ 

                db.Question.create({
                    id: q_id,
                    text: text
                }).then(function(result){
                    next();
                });

            },
            function(next){ 

                async.eachLimit(answers, 1, function(answer, done) {

                    var a_id = uuid.v4();
                    var text = answer;
                    order++;

                    db.Answer.create({
                        id: a_id,
                        question_id: q_id,
                        text: text,
                        order: order,
                        count: 0
                    }).then(function(answer){
                        done();
                    });

                }, function(err) {
                    next();
                });
                
            }
        ],function(err){

            var status = err || 'added';
            if(res) res.send({'error':true});
            else return true;

        });

        
    }else{
        if(res) res.send({'error':true});
        else return false;
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
            where: { question_id: Sequelize.col('question.id') }
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

// Adds dummy questions if none
QuestionCtrl.checkQuestion = function() {
    db.Question.findOne().then(function(question) {
        if(!question){

            // Add each dummy record.
            var dummy = require('../dummy.json');            
            dummy.questions.forEach(function(question){
                QuestionCtrl.addQuestion({body: question}, null);
            });

        }
    });
};