// main.js9
var fs = require('fs')
var React = require('react');
var ReactDOM = require('react-dom');
var M1 = require('../js_modules/m1_operations.js');
var ACTIVE_ACCOUNT;

var EmailList = React.createClass({
  activeaccount: function(){
    var sp = $('div#left-container').attr("data-spname");
    var name = $('div#left-container').attr("data-accountname");
    getObjectFromDatabase(sp, name, (doc)=>{
      ACTIVE_ACCOUNT = doc;
    })
  },

  loadmail: function() {
    if (!ACTIVE_ACCOUNT) {
      return;
    }

    if (ACTIVE_ACCOUNT.user_account_name != this.state.account) {
      this.setState({data: [], account: ACTIVE_ACCOUNT.user_account_name});
    }

    if (this.state.data.length == 0) {
      M1.Get_path_and_dir(ACTIVE_ACCOUNT, (result) =>{
        if (result.length > 0) {
          this.setState({data: result});
        } else {
          M1.Fetching_new_message(ACTIVE_ACCOUNT, '', this);
        }
      });
    } else {
      // console.log('TO BE REPLACED WITH ACTION PER USER_HISTORY');
      // console.log('fetching new data at interval. Specify a query to filter mesage in Gmail list request')
      var query = 'after:'+ this.state.data[0]['internalDate'].substring(0,10);
      M1.Fetching_new_message(ACTIVE_ACCOUNT, query, this);
    }
  },

  getInitialState: function() {
    return ({data: [], account: ''});
  },

  componentDidMount: function() {
    this.loadmail();
    setInterval(this.loadmail, this.props.pollInterval);
    setInterval(this.activeaccount, this.props.pollInterval);
  },

  render: function() {
    var emailhead = this.state.data.map(function(message, i) {
      var head = message.payload.headers;
	  var headerText = '';
      for (i = 0; i < head.length; i++) {
        if (head[i].name == 'Subject') {
          headerText = head[i]['value'];
		  break;
        }
      }
	  var dateText = parseInt(message.internalDate);
	  dateText = new Date(dateText);
	  dateText = dateToDMY(dateText);
      return (<EmailHead key={message.id} emailtitle = {headerText} emailtime={dateText}/>)
    });

    return (<div className = "emaillist" >{emailhead}</div>);
  }
});


ReactDOM.render(
  <EmailList pollInterval = {1000} />,
  document.getElementById('conversationdiv')
);


var EmailHead = React.createClass({
    render: function() {
        return (
          <div className = 'emailhead'>
		    <span className='alignLeft'>{this.props.emailtitle}</span>
			<span className='alignRight'>{this.props.emailtime}</span>
		  </div>
        );
    }
});
