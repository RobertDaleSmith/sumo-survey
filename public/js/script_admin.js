
// Closes and clear New Question Form
var closeNewQuestionForm = function(){
	$("#newQuestionWrapper").css('display','none');
	$("#questionText").val('');
	$(".answerText").val('');
	$(".answer-group").not('.primary').remove();
};

$(window).bind("load", function() {

	// Opens New Question Form
	$("#addNewQuestionBtn").click(function(){
		$("#newQuestionWrapper").css('display','block');
		$("#questionText").focus();
	});

	// Adds another Answer to Question
	$("#addNewAnswerBtn").click(function(){

		var idx = $(".answerText").length + 1;

		var element = $('<div/>')
			.addClass('input-group answer-group')
			.append($('<span/>')
				.addClass('input-group-addon')
				.text(idx+".")				
			)
			.append($('<input>')
				.addClass('answerText form-control')
				.attr('name', 'answerText')
				.attr('type', 'text')
				.attr('placeholder', 'Another answer..')
			)
		;

		$('#newAnswersWrapper').append(element);
		$(".answerText")[idx-1].focus();
	});

	// Cancels New Question Form
	$("#cancelNewQuestionBtn").click(function(){

		closeNewQuestionForm();

	});

	// Saves New Question with Answers
	$("#saveNewQuestionBtn").click(function(){

		// Get Question Value
		var questionTx = $("#questionText").val();

		// Get Answer Values
		var answersEl = $(".answerText");
		var answersTx = [];
		for(var i=0; i<answersEl.length; i++){
			var text = $(answersEl[i]).val();
			if(text!="")answersTx.push(text);
		}

		var question = {
			text: questionTx,
			answers: answersTx
		}

		if(questionTx != "" && answersTx.length>1){
			
			// AJAX POST Question/Answers
			$.post('/question', question, function(res){
				console.log(res);
				window.location.reload();
			});

			console.log(question);
			closeNewQuestionForm();
		} else {
			alert("Question can't be blank and it must have at least two answers.");
		}

	});

	$(".delQuestionBtn").click(function(){

		var question_id = $(this).parent().attr('qid');

		console.log(question_id);

		$.delete('/question?_id='+question_id);

		$("#q_"+question_id).remove();

	});

});	