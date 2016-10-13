// Script to run, yet to follow a specific UML, which we are still building
// The script is meant to test in the early development stage

'use strict';
// I ------------------ General declarations
// Prepare global vars
var fs = require('fs');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var gmail = google.gmail('v1');
var M1 = require('./js_modules/m1_operations.js');

// gmail constants:
var SCOPES = ['https://mail.google.com/']; // Full access to Gmail account
var TOKEN_DIR = './base/temp/';
var ACCOUNTARRAY = [];
var CLIENTID;
var CLIENTSECRET;
fs.readFile('./base/temp/client_secret.json', function processClientSecrets(err, content) {
    if (err) return console.log('Error loading client secret file: ' + err);
    var credentials = JSON.parse(content);
    CLIENTSECRET = credentials.installed.client_secret;
    CLIENTID = credentials.installed.client_id;
});

// var GLOBAL_RESPONSE = [];

// reusable components
function login_window(url) {
    const BrowserWindow = require('electron').remote.BrowserWindow
    const path = require('path')

    let win = new BrowserWindow({
        width: 600,
        height: 480
    })
    win.on('close', function() {
        win = null
    })
    win.loadURL(url);
    win.show();
    return win;
}




// II ------------------- Functions

// General functions
function loadExistingAccounts() {
    // Open database and perform operations
    searchDatabaseWithQuery(accounts => {
      if (accounts.length == 0) return;
      for (let account of accounts) {
        let sp = account.user_account_type;
        let user_account_name = account.user_account_name;
        append_new_account(sp, user_account_name, (accounts.indexOf(account) == 0) ? true : false);
      }
    });
}

function addNewAccount(sp_name) {
    // Them tai khoan email, sp_name la ten nha cung cap dich vu
    // Hien tai sp_name duy nhat xet den la gmail
    switch (sp_name) {
        case 'gmail':
            addNew_Gmail_Account();
            break;

        case 'Facebook':

            break;

        case 'Skype':

            break;

        default:
    }
}



// A. Gmail api -specfic functions
// A. 1. Authorization and access token
function addNew_Gmail_Account() {
    // Khoi tao tu client_secret.json
    fs.readFile('./base/temp/client_secret.json', function processClientSecrets(err, content) {
        if (err) return console.log('Error loading client secret file: ' + err);
        authorize_gmail(JSON.parse(content));
    });
}

function authorize_gmail(credentials, callback) { // No callback for now.
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    var win = new login_window(authUrl);
    win.on('page-title-updated', function() {
        var title = win.getTitle();
        if (title.startsWith('Success code=')) {
            var authCode = title.substring(13);
            win.close();
            oauth2Client.getToken(authCode, function(err, token) {
                if (err) return alert('Unable to verify your account. Please check your login information again!');
                oauth2Client.credentials = token;
                var access_token = token['access_token'];

                // Get user email address and other info with API getProfile
                gmail.users.getProfile({
                    access_token: access_token,
                    userId: 'me'
                }, function(err, response) {
                    (!err) && insertNewDocIntoDatabase('gmail', response.emailAddress, token);
                });
            });
        } else if (title.startsWith('Denied')) {
            win.close();
            alert('Access not granted. Please allow to kick-off Gmail Service');
        }
    });
}

function load_gmail_stuff(account, callback) {
  var credential = account.key_access;
  if (credential.expiry_date < new Date().getTime()) {
      console.log('Token expired. Now get new access token');
      get_new_access_token(credential.refresh_token, account.user_account_name, callback);
  } else {
    callback(account.user_account_name, credential.access_token);
  }
}

function get_new_access_token(refresh_token, userId, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/oauth2/v4/token', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onloadend = function() {
        // Return new access token
        (this.status == 200) && callback(userId, JSON.parse(this.responseText).access_token);
    };
    var param = 'client_id=' + CLIENTID + "&client_secret=" + CLIENTSECRET + "&refresh_token=" + refresh_token + "&grant_type=refresh_token";
    xhr.send(param);
}

// A. 2. Calling google apis to get whatever we need
function gmail_labels_list(userId, access_token) {
    gmail.users.labels.list({
        access_token: access_token,
        userId: userId
    }, (err, response) => {
        if (err) return console.log('The API returned an error: ' + err);
        var labels = response.labels;
        if (labels.length == 0) {
            console.log('No labels found.');
        } else {
            console.log('Labels:');
            for (var i = 0; i < labels.length; i++) {
                var label = labels[i];
                console.log('- %s', label.name);
            }
        }
    })
}

function gmail_messages_list(userId, access_token, maxResults, query, callback) {
    gmail.users.messages.list({
        access_token: access_token,
        userId: userId,
        q: query,
        maxResults: maxResults,
    }, (err, response) => {
        if (!err) return callback(response);
    })
}

function gmail_messages_get(userId, access_token, messageId, callback){
    gmail.users.messages.get({
    userId: userId,
    access_token: access_token,
    id: messageId
  }, (err,response) => {
    if (!err) return callback(response);
  })
}
