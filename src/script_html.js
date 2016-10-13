// resize every godddamn thing
$(document).ready(function() {
  resizeAll()
});

$(window).resize(function() {
	resizeAll();
	console.log($('div#functional-container').width() + "x" + $('div#functional-container').height());
});

function resizeAll() {
	$('div#left-container').height(window.innerHeight - 1);
	$('div#rest-container').height($('div#left-container').height());
	$('div#functional-container').width($('div#rest-container').width() - $('div#rightbar-container').width()-10);
	$('div#functional-container').height($('div#rest-container').height());


	//resize form controls
	$('div#conversationdiv').width($('div#functional-container').width());
	$('div#conversationdiv').height($('div#functional-container').height()-$('div#searchdiv').height()-$('div#chatboxdiv').height()-20);

	$('div#searchdiv').width($('div#conversationdiv').width());
	$('div#chatboxdiv').width($('div#conversationdiv').width());
	$('textarea').width($('div#chatboxdiv').width()-60);
	$('input#search-input').width($('div#searchdiv').width()-10);

}


    // Authorize login to gmail
function append_new_account(sp, user_account_name, trigger) {
  let i = $('.accselect').length;
  let append = '<div id="accselect'+i+'" class="accselect" data-spname="' + sp + '" data-accountname="'+user_account_name+'" onclick="changeacc(this)"><span class="nav-group-item" ><span class="icon icon-mail"></span>'+user_account_name+'</span></div>';
  $('nav#left-nav').append(append);
  trigger && $('div#accselect'+i).trigger("click");
}

function changeacc(object){
  eventEmitter.emit('Acc_Change', $(object).attr("data-spname"),  $(object).attr("data-accountname"));
}


eventEmitter.on('Acc_Change', (sp, name) => {
  getObjectFromDatabase(sp, name, (doc)=>{
    ACTIVE_ACCOUNT = doc;
    eventEmitter.emit('React_listen_to_Acc_change');
  })
});


function dateToDMY(date) {
  var d = date.getDate();
  var m = date.getMonth() + 1;
  var y = date.getFullYear();
  return '' +  (d <= 9 ? '0' + d : d) + '/' + (m<=9 ? '0' + m : m) + '/' + y;
}

function dateToHm(date) {
  var h = date.getHours();
  var m = date.getMinutes();
  return '' +  (h <= 9 ? '0' + h : h) + ':' + (m<=9 ? '0' + m : m);
}