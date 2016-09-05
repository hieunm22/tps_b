// Script to run, yet to follow a specific UML, which we are still building
// The script is meant to test in the early development stage

// I ------------------ General declarations
// Prepare global vars
var fs = require('fs');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var gmail = google.gmail('v1');

// gmail constants:
var SCOPES = ['https://mail.google.com/']; // Full access to Gmail account
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var ACCOUNTARRAY = [];
var CLIENTID;
var CLIENTSECRET;
fs.readFile('./base/client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    var credentials = JSON.parse(content);
    CLIENTSECRET = credentials.installed.client_secret;
    CLIENTID = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
});

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
function encryptor(str, forward) { // function to encode/decode string
    var new_string;
    if (forward) {
        // forward encoding string:
        // ** this is one way to encode the filename, simple but lets say it works
        // encoded_string = (((email.replace('@','2205mfnne')).replace('.com','wtf002384----------------hhuhs')).replace('.','morezsh!t')).replace('gmail','larrybinmy@@s');
        // but, lets keep it modest for now
        new_string = ('gm-' + str).replace('@gmail.com', '19871710');

    } else if (!forward) {
        // decode string here
        new_string = (str.replace('19871710', '@gmail.com')).substring(3);
    }
    return new_string;
}

function loadExistingAccounts() {
    // Lay cac tai khoan da luu trong app. va kiem tra tinh trang cap phep truy cap truoc khi lam viec
    var account_array;
    fs.readFile('./base/accmttxtzz.paz', 'utf8', function readAccountsFromText(err, content) {
        if (err) {
            console.log('Error loading data file: ' + err);
            return;
        } else {
            // Content la noi dung da~ bi encrypt. Bo sung thuat toan giai? ma~ o day:
            // var contentTextDecoded = decodeContent(content);
            // Tam thoi coi nhu content ko bi encrypt
            account_array = content.split("\n");
            if (account_array.length == 0) {
                return;
            } else {
                verfiy_authorization_status(account_array);
                for (var i = 0; i < account_array.length; i++) {
                    ACCOUNTARRAY.push(account_array[i]);
                }
            }
        }
    });
}

function verfiy_authorization_status(account_array) {
    for (var i = 0; i < account_array.length; i++) {
        // Xac nhan tinh trang authorization cua account
        // ** nghien cuu sau

        // neu authorized email thi bat dau load email box
        if (encryptor(account_array[i], false).includes('@')) {
            console.log('FOUND SOME GMAILS');
            loadMailBox(account_array[i]);
        }

        // neu la cac account loai khac thi else if
    }
}

function loadMailBox(encoded_string) {
    // decode this string to determine the account type before proceeding further
    var account = encryptor(encoded_string, false);

    // neu la gmail thi:
    if (account.includes('gmail.com')) {
        // lay luon encoded_string de xac dinh TOKEN_PATH
        load_gmail_account(encoded_string);
    }

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
    fs.readFile('./base/client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        authorize_gmail(JSON.parse(content), loadMailBox);
    });
}

function authorize_gmail(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    // Store a temporary TOKEN, which shall be renamed after we get user's email address
    // ...so in case it already exists in the database, we will cancel other works and focus on updating email inbox only
    var TOKEN_PATH = TOKEN_DIR + 'gmail-tempy.json';

    var win = new login_window(authUrl);
    win.on('page-title-updated', function() {
        var title = win.getTitle();
        if (title.startsWith('Success code=')) {
            var authCode = title.substring(13);
            win.close();
            oauth2Client.getToken(authCode, function(err, token) {
                if (err) {
                    alert('Unable to verify your account. Please check your login information again!');
                    return;
                }
                oauth2Client.credentials = token;
                try {
                    fs.mkdirSync(TOKEN_DIR);
                } catch (err) {
                    if (err.code != 'EEXIST') {
                        throw err;
                    }
                }
                fs.writeFile(TOKEN_PATH, JSON.stringify(token));
                console.log('Token stored to ' + TOKEN_PATH);
                var access_token = token['access_token'];

                // Get user email address and other infor with API getProfile
                // should this be moved outside of this function?
                gmail.users.getProfile({
                    access_token: access_token,
                    userId: 'me'
                }, function(err, response) {
                    if (!err) {
                        var encoded_string = encryptor(response.emailAddress, true);

                        // After getting email address, we rename the tempy_json to match database
                        // .. we also probably need to encode email_address
                        // After renaming, call straight to loadMailBox, we have everything we need
                        // if the account exists already, skip the appendFile function
                        write_new_entry(encoded_string, callback);
                    }
                });

            });
        } else if (title.startsWith('Denied')) {
            win.close();
            alert('Access not granted. Please allow to kick-off Gmail Service');
        }
    });
}

function load_gmail_account(str) {
    // build TOKEN_PATH to the json
    var TOKEN_PATH = TOKEN_DIR + str;
    console.log('load gmail acount :' + TOKEN_PATH);
    // read the json and get the access_token
    // Asynchronos reading operation, therefore the remaining working inside the code block only
    fs.readFile(TOKEN_PATH, (err, content) => {
        if (err) {
            console.log('Error reading content of token json');
        }
        var credential = JSON.parse(content);
        var access_token = credential.access_token;

        // Check expiry date of the access token,
        // if it is expired, we need to send ajax request to get a new one
        if (credential.expiry_date > new Date().getTime()) {

        }

        gmail_labels_list(encryptor(str, false), access_token);
    })
}

function write_new_entry(str, callback) {
  // We have to rename the tempy_json even the account already exists, in case
  // ...the old one is accidentally lost while account remains in database
  // ...The renameSync function is SYNCHRONOS, because the file must be renamed first before...
  // ...we can access the json with the new name in the later functions
  var oldpath = TOKEN_DIR + 'gmail-tempy.json';
  var newpath = TOKEN_DIR + str; // we may choose to hide the file extesion?
  fs.renameSync(oldpath, newpath);
    // Check if this account is already in the database, if not, write to the database
    if (ACCOUNTARRAY.indexOf(str) < 0) {
        // call node.js FileSystem to append new entry to our database
        fs.appendFile('./base/accmttxtzz.paz', str + '\n', 'utf8', (err) => {
            if (err) throw err;
            console.log('Update database');
            callback(str)
        });
    } else {
        alert('This Account already exists');
        console.log('No need update database');
    };


}

function get_new_access_token(userId, refresh_token) {
  // to be continued
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://www.googleapis.com/oauth2/v4/token', true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onload = function() {
      // Lay duoc access_token thi bat dau goi cac Api ra
      console.log(this.responseText);
      console.log(JSON.parse(this.responseText).access_token);
      var resume_access_token = JSON.parse(this.responseText).access_token;
  };
  var param = 'client_id=' + CLIENTID + "&client_secret=" + CLIENTSECRET + "&refresh_token=" + refresh_token + "&grant_type=refresh_token";
  xhr.send(param);
}

// A. 2. Calling apis, AJAX
function gmail_labels_list(userId, access_token) {
    gmail.users.labels.list({
        access_token: access_token,
        userId: userId
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
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
