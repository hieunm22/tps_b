// Usin TingoDB (a documented database, non RDMS (NoSQL) to store user information)

var Engine = require('tingodb')(),
    assert = require('assert');
var fs = require('fs')

var M1 = require('./js_modules/m1_operations.js');
var events = require('events');
var eventEmitter = new events.EventEmitter();

var ACTIVE_ACCOUNT;


// See if we have a db already
// Node.js asynchronos function 'fs.access' to confirm accessiblity/availability of a file
fs.access('./base/base', fs.constants.W_OK | fs.constants.R_OK, function(err) {
    if (!err) {
        loadExistingAccounts();
    } else {
        console.log('NO DATABASE');
    }
});


function insertNewDocIntoDatabase(sp, user_account_name, key_access) {
    var db = new Engine.Db('./base', {});
    var collection = db.collection("base");

    collection.insert({
        user_account_type: sp,
        user_account_name: user_account_name,
        key_access: key_access
    }, (err, result) => {
        if (!err) {
            // set a path to store downloaded data
            var path = './base/content/' + sp + '__' + user_account_name;
            // make a directory using the path above
            fs.mkdir(path, (err) => {
                if (!err) {
                  var account = {'user_account_type': sp, 'user_account_name': user_account_name, 'key_access': key_access};
                  append_new_account(sp, user_account_name, true);
                  M1.Fetching_new_message(account, '');
                }
            });
        }
    });

    // create a new nav in the left bar

    // create index to avoid duplicate
    var option = {
        unique: true,
        background: true,
        w: 1
    };
    collection.createIndex('user_account_name', option);
    db.close();
}


// Get a specific object from database out and pass a callback on it
function getObjectFromDatabase(sp, user_account_name, callback) {
    var db = new Engine.Db('./base', {});
    var collection = db.collection("base");
    var doc = collection.findOne({
        user_account_type: sp,
        user_account_name: user_account_name
    }, function(err, doc) {
        if (!err) return callback(doc);
        console.log('NOT FOUND IN DATABASE');
    });
    db.close();
}

// Get all objects from the database
function searchDatabaseWithQuery(callback) {
    var db = new Engine.Db('./base', {});
    var collection = db.collection("base");
    collection.find().toArray(function(err, docs) {
        if (!err) return callback(docs);
    });
    db.close();
}

/*
structure of tingoDB document:
- user_account_type(service provider info)
- user_account_name
- access_type (oauth2 or something else?) ---/ maybe it's not neccessary if I perform straight authentication based on service provider type
- key_access (json body)

*/
