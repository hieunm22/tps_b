var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var gmail = google.gmail('v1');


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

function callgwin() {
    // Load client secrets from a local file.
    fs.readFile('./base/client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }

        var credentials = JSON.parse(content);
        authorize_b(credentials);

    });

    function authorize_b(credentials) {
        var clientSecret = credentials.installed.client_secret;
        var clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var auth = new googleAuth();
        var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });

        // Open a new window with new URL
        const BrowserWindow = require('electron').remote.BrowserWindow
        const path = require('path')

        let win = new BrowserWindow({
            width: 600,
            height: 480
        })
        win.on('close', function() {
            win = null
        })
        win.loadURL(authUrl)
        win.show()

        win.on('page-title-updated', function() {
            var title = win.getTitle();
            console.log(win.getURL());
            if (title.startsWith('Success code=')) {
                title = title.substring(13);
                win.close();
                getToken(oauth2Client, title);
            } else if (title.startsWith('Denied')) {
                win.close();
                alert('Access not granted. Please allow to kick-off Gmail Service');
            }
        })

    }

}


function getToken(oauth2Client, code) {
    oauth2Client.getToken(code, function(err, token) {
        if (err) {
            alert('Unable to verify your account. Please check your login information again!');
            return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
        listAll(oauth2Client);
    });
}


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

function automatic_login_gmail() {
    console.log('auto login email');

    var url_request;
    var clientId;
    var clientSecret;
    var refresh_token;
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }

        var credentials = JSON.parse(content);
        clientSecret = credentials.installed.client_secret;
        clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];

        fs.readFile(TOKEN_PATH, function processClientSecrets(err, content) {
            if (err) {
                // Neu ko co san Credentials thi yeu cau Login
                console.log('Error loading client secret file: ' + err);
                alert('Login your Gmail Account');
                return;
            }

            // Neu da co credential thi lay Token moi bang refresh_token de tu dong login
            var credentials = JSON.parse(content);
            refresh_token = credentials.refresh_token;

            // POST request to Server to get new Access_token
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://www.googleapis.com/oauth2/v4/token', true);
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhr.onload = function() {
                // Lay duoc access_token thi bat dau goi cac Api ra
                console.log(this.responseText);
                console.log(JSON.parse(this.responseText).access_token);
                var resume_access_token = JSON.parse(this.responseText).access_token;
                listAll(resume_access_token);

            };
            var param = 'client_id=' + clientId + "&client_secret=" + clientSecret + "&refresh_token=" + refresh_token + "&grant_type=refresh_token";
            xhr.send(param);
        });
    });
}



function listAll(access_param) {

    // get Label list first
    gmail.users.labels.list({
        access_token: access_param,
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
            result = 'Labels: <br />';
            for (var i = 0; i < labels.length; i++) {
                var label = labels[i];
                if (label.type == 'system' && label.name.startsWith('CATEGORY_'))
                    result += '- ' + label.name.substring(9) + '<br />';
                else
                    result += '- ' + label.name + '<br />';
            }
        }
        $('div#content').html(result);
        $('div#conversationdiv').height($('div#functional-container').height() - $('div#content').height() - 230);
    });

    // Get message list
    gmail.users.messages.list({
        access_token: access_param,
        userId: 'me',
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var messages = response.messages;
        var result = '';
        if (messages.length == 0) {
            result = 'No messages found.';
        } else {
            result = 'Messages: <br />';

            // Lay ra 10 mail dau tien
            for (var i = 0; i < 10; i++) {
                var message = messages[i];
                result += '- <a href="#" onclick="getMessage(\'me\', \'' + message.id + '\')">' + message.id + '</a><br />';
            }
        }
        $('div#conversationdiv').html(result);
    });

}

function getMessage(userId,messageId) {

}
