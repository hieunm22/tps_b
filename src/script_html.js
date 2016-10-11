function append_new_account(sp, user_account_name, trigger) {
  var i = $('.accselect').length;
  var append = '<div id="accselect'+i+'" class="accselect" data-spname="' + sp + '" data-accountname="'+user_account_name+'" onclick="changeacc(this)"><span class="nav-group-item" ><span class="icon icon-mail"></span>'+user_account_name+'</span></div>';
  $('nav#left-nav').append(append);

  if (trigger) {
    $('div#accselect'+i).trigger("click");
  }
}

function changeacc(object){
  document.getElementById("left-container").setAttribute("data-spname", object.getAttribute("data-spname"));
  document.getElementById("left-container").setAttribute("data-accountname", object.getAttribute("data-accountname"));
}

function dateToDMY(date) {
  var d = date.getDate();
  var m = date.getMonth() + 1;
  var y = date.getFullYear();
  return '' +  (d <= 9 ? '0' + d : d) + '/' + (m<=9 ? '0' + m : m) + '/' + y;
}
