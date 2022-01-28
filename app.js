'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const fs = require('fs');
const { stringify } = require('querystring');

const { Server } = require("socket.io");


/*var routes = require('./routes/index');
var users = require('./routes/users');*/

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/users', function (req, res) {
    res.send('POST request to the page + ' + req.body.name + ' ' + saveUserInscription(req.body.name));
});

function saveUserInscription(fileToSave) {
    fs.readFile(path.join(__dirname, "public/docs/name.json"), function (err, data) {
        var jsonObj = JSON.parse(data);
        var keys = Object.keys(jsonObj.members);
        //création d'un nouveau user
        var i = keys.length + 1;
        var newUser = "user" + i;
        var newValue = fileToSave;
        jsonObj.members[newUser] = newValue;
        try {
            fs.writeFileSync(path.join(__dirname, "public/docs/name.json"), JSON.stringify(jsonObj));
            return newUser;
        } catch (e) {
            return "failed sign in";
        }
    })
}

//à la première connexion --> direction la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public/chat.html"));
});

app.get('/users', function (req, res) {
    res.send('GET request to the page');
});

//app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', 1337);

var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});

const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('register', (userName) => {
        saveUserInscription(userName);
        socket.id = userName;
        console.log("user saved in db with name " + socket.id);
        var usersConnected = Array.from(io.sockets.sockets.values());
        var idUsersConnected = new Array(usersConnected.length);
        for (var i = 0; i < usersConnected.length; i++) {
            idUsersConnected.push(usersConnected[i].id);
        }
        io.emit("register", idUsersConnected);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', socket.id + ": " + msg);
    });

    socket.on('loveLetterChat message', (msg) => {
        io.emit('loveLetterChat message', socket.id + ": " + msg);
    });
});

