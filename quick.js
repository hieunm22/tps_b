var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
function fnToken() {
	var fs = require('fs');
	var readline = require('readline');
	var google = require('googleapis');
	var googleAuth = require('google-auth-library');

	// If modifying these scopes, delete your previously saved credentials
	// at ~/.credentials/gmail-nodejs-quickstart.json

	var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
		process.env.USERPROFILE) + '/.credentials/';
	var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

	// Load client secrets from a local file.
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
	  if (err) {
		console.log('Error loading client secret file: ' + err);
		return;
	  }
	  // Authorize a client with the loaded credentials, then call the
	  // Gmail API.
	  var _credentials = JSON.parse(content);

	  // Create an OAuth2 client with the given credentials, and then execute the
	  // given callback function.
	  //
	  // @param {Object} credentials The authorization client credentials.
	  // @param {function} callback The callback to call with the authorized client.
	  var clientSecret = _credentials.installed.client_secret;
	  var clientId = _credentials.installed.client_id;
	  var redirectUrl = _credentials.installed.redirect_uris[0];
	  var auth = new googleAuth();
	  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	  // Check if we have previously stored a token.
	  fs.readFile(TOKEN_PATH, function(err, token) {
		if (err) {
		  getNewToken(oauth2Client, listLabels);
		} else {
		  oauth2Client.credentials = JSON.parse(token);
		  listLabels(oauth2Client);
		}
	  });
	});
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  if (typeof readline == 'undefined') return;
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  var google = require('googleapis');
  var gmail = google.gmail('v1');
  gmail.users.labels.list({
    auth: auth,
    userId: 'me',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var labels = response.labels;
	var result = '';
    if (labels.length == 0) {
      result = 'No labels found.';
    } else {
      result = 'Labels: <br /><ul>';
      for (var i = 0; i < labels.length; i++) {
		var label = labels[i];
        result += '<li>'+ label.name + '</li>';
      }
	  result += '</ul>';
    }
	$('div#content').html(result);
	$('div#conversationdiv').height($('div#functional-container').height() - $('div#content').height() - 230);
  });
}
