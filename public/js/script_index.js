
var timer;

var openModal = function(){

	$('.reveal-modal-bg').css('display','block');
	
	$('#cta-modal').css('display','block');
	$('#cta-modal').css('visibility','visible');

	clearTimeout(timer);
	timer = setTimeout(function(){
		$('#cta-modal').css('opacity','1');
		$('#cta-modal').css('top','100px');
	},1);

};

var closeModal = function(){

	$('.reveal-modal-bg').css('display','none');

	$('#cta-modal').css('opacity','');
	$('#cta-modal').css('top','');

	clearTimeout(timer);
	timer = setTimeout(function(){
		$('#cta-modal').css('display','');
		$('#cta-modal').css('visibility','');
	},500);

};

$('#tryNowButton').click(function(){

	openModal();
	
});

$('.close-reveal-modal, .reveal-modal-bg').click(function(){

	closeModal();
	
});

$('#skipLink').click(function(){

	window.location.reload();
	
});