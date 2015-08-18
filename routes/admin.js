
var express = require('express');
var router = express.Router();

var AdminCtrl = require('../controller/AdminCtrl.js');
var AnswerCtrl = require('../controller/AnswerCtrl.js');
var QuestionCtrl = require('../controller/QuestionCtrl.js');


// Admin Middleware
function requireAdmin(req, res, next) {
	if( req.session.admin && req.session.loggedIn ){
		next();
	}else{
		// Renders Admin Login page
        res.render('admin/login', {
            title:  'Login',
            error: req.flash('error')
        });
	}
};

function requireAdminAjax(req, res, next) {
	if( req.session.admin && req.session.loggedIn ){
		next();
	}else{
		res.status(403);
		res.send({success:false, error:'Not logged in'});
	}
};

// Admin interface
router.get( '/admin', requireAdmin, AdminCtrl.adminDash);

// Admin log-in post
router.post( '/admin', AdminCtrl.loginAdmin);

// Admin log-out
router.get( '/admin/logout', AdminCtrl.logoutAdmin);

// Renders Edit Survey Questions page
router.get( '/admin/questions', requireAdmin, AdminCtrl.renderQuestions);

// Renders Reports page
router.get( '/admin/reports', requireAdmin, AdminCtrl.renderReports);


// Get a Question and it's Answers
router.get('/question', requireAdminAjax, QuestionCtrl.getQuestion);

// Add a Question
router.post('/question', requireAdminAjax, QuestionCtrl.addQuestion);

// Remove a Question and it's Answers
router.delete('/question', requireAdminAjax, QuestionCtrl.removeQuestion);


// Get all Questions with Answers
router.get('/questions', requireAdminAjax, QuestionCtrl.listQuestions);

// Get an Answer
router.get('/answer', requireAdminAjax, AnswerCtrl.getAnswer);

// Add an Answer to a Question
router.post('/answer', requireAdminAjax, AnswerCtrl.addAnswer);

// Remove an Answer
router.delete('/answer', requireAdminAjax, AnswerCtrl.removeAnswer);


module.exports = router;
