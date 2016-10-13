// main.js9
var fs = require('fs')
var React = require('react');
var ReactDOM = require('react-dom');
var M1 = require('../js_modules/m1_operations.js');


var EmailList = React.createClass({
  loadmail: function() {
    // Get from dir
    M1.Get_path_and_dir(ACTIVE_ACCOUNT, (result) => {
      this.setState({data: result, account: ACTIVE_ACCOUNT.user_account_name});
    })
  },

  getInitialState: function() {
    return ({data: [], account: ''});
  },

  fetch: function() {
    if (ACTIVE_ACCOUNT) {
      var query = this.state.data.length > 0 ? ('after:'+ this.state.data[0]['internalDate'].substring(0,10)) : '';
      // console.log('Interval fetching with query: ' + query);
      M1.Fetching_new_message(ACTIVE_ACCOUNT, query)
    }
  },

  componentDidMount: function() {
    eventEmitter.on('React_listen_to_Acc_change', this.loadmail);
    eventEmitter.on('Incoming_Message', this.loadmail);
    setInterval(this.fetch, this.props.pollInterval);
  },

  render: function() {
    var emailhead = this.state.data.map(function(message, i) {
      var head = message.payload.headers;
	  var headerText = '';
	  var fromText = '';
      for (i = 0; i < head.length; i++) {
        if (head[i].name == 'Subject') {
          headerText = head[i]['value'];
		  // break;
        } else if (head[i].name == 'From') {
          fromText = head[i]['value'];
		  // break;
        }
      }
	  var receivedTime = parseInt(message.internalDate);
	  receivedTime = new Date(receivedTime);
	  var receivedTimeStr = dateToDMY(receivedTime);
	  if (receivedTimeStr == dateToDMY(new Date())) {
		receivedTimeStr = dateToHm(receivedTime);
	  }
      return (<EmailHead key = {message.id} emailsender = {fromText} emailtitle = {headerText} emailtime={receivedTimeStr}/>)
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
		    <span className='alignLeft'>{this.props.emailtitle} - {this.props.emailsender}</span>
			<span className='alignRight'>{this.props.emailtime}</span>
		  </div>
        );
    }
});
