
// Closes and clear New Question Form
var closeNewQuestionForm = function(){
	$("#newQuestionWrapper").css('display','none');
	$("#questionText").val('');
	$(".answerText").val('');
	$(".answer-group").not('.primary').remove();
};

$(window).bind("load", function() {

	// Opens New Question Form
	$("#addQuestionBtn").click(function(){
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
			if(text!="")answersTx.push();
		}

		var question = {
			text: questionTx,
			answers: answersTx
		}

		// AJAX POST Question/Answers
		console.log(question);

		closeNewQuestionForm();

	});

	$(".delQuestionBtn").click(function(){

		var question_id = $(this).parent().attr('qid');

		console.log(question_id);

		//AJAX POST to remove Question

		$("#q_"+question_id).remove();

	});

});	