var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    Handler = require('./lib/handlers.js'),
    config = require('./config/config')().getSettings(),
    DB = require('./lib/db');

app.listen(config.server.port, config.server.host);
io.set("browser client minification", 1);
io.set('log level', 1);

function handler(req, res) {
    /* POST METHOD */
    if (req.method == "POST") {
        Handler.postHandler(req, res);
    } else {
        Handler.staticHandler(req, res);
    }
}

io.sockets.on('connection', function(socket) {

    var messager = {};

    /* Sockets Catcher **/
    socket.on('sunucu_mesajGonder', function(data) {
        data = cleaner(data);
        io.sockets.emit("istemci_mesajAl", {
            user: socket.user.name,
            message: data
        });
        socket.broadcast.emit('istemci_bildirim', {
            yazan: socket.user.name
        });
        /* Write DB */
        new DB.Message({
            user: socket.user.name,
            message: data
        }).save();
    });


    /* If user disconnected remove db. */
    socket.on("disconnect", function() {
        if (typeof socket.user != 'undefined ' && socket.user != undefined) {
            DB.User.find({
                name: socket.user.name
            }, function(err, users) {
                if (err) next();

                for (i in users) {
                    users[i].remove();
                }

                //trigger logoutAfter
                messager.logoutAfter();
            });
        }
    });

    socket.on("login", function(user) {

        /* Attempt Login */
        messager.attemptLogin(user, function(u) {
            socket.emit("login.after", {
                name: socket.user.name,
                login: true
            });
            messager.loginAfter(user);

        });

    });



    messager.attemptLogin = function(user, cb) {
        if (user.login) {
            messager.findUser(user, cb);
        } else {
            messager.addUser(user, cb);
        }
    };

    /* Find User */
    messager.findUser = function(user, cb) {
        DB.User.findOne({
            name: user.name
        }, function(err, u) {
            if (err) next();
            socket.user = {
                id: u._id,
                name: u.name
            };
            if (cb) return cb(u);
        });
    };

    /* Add User */
    messager.addUser = function(user, cb) {
        var u = new DB.User({
            name: user.name
        });
        u.save(function(err) {
            if (err) next();
            socket.user = {
                id: u._id,
                name: u.name
            };
            if (cb) return cb(u);
        });
    };

    messager.loginAfter = function(user, cb) {
        messager.updateOnlines(function() {
            if (!user.login) {
                messager.getRecentMessages(function() {
                    socket.broadcast.emit("istemci_sistemMesajAl", {
                        user: "Sistem",
                        message: socket.user.name + ' connected.'
                    });
                    if (cb) return cb();
                });
            } else {
                socket.broadcast.emit("istemci_sistemMesajAl", {
                    user: "Sistem",
                    message: socket.user.name + ' connected.'
                });
                if (cb) return cb();
            }

        });
    };

    messager.logoutAfter = function() {
        messager.updateOnlines(function() {
            socket.broadcast.emit("istemci_sistemMesajAl", {
                user: "Sistem",
                message: socket.user.name + ' disconnected.'
            });
        });

    };
    messager.updateOnlines = function(cb) {
        DB.User.find({}, function(err, users) {
            io.sockets.emit("istemci_kullanicilariYenile", users);
            if (cb) return cb();
        });
    };
    messager.getRecentMessages = function(cb) {
        DB.Message.find({}).sort({
            date: -1
        }).limit(20).exec(function(err, messages) {
            socket.emit("gecmisiOku", messages);
            if (cb) return cb();
        });
    };

});

/* 
 *
 * Delete Old Message from MongoDB.
 *
 * @time 1 hour.
 * @deleteCount All messages except last 20 messages.
 *
 * Future: Implement Redis Interface
 *
 */

(function deleteOldMessages() {
    DB.Message.count({}, function(e, count) {
        deleteCount = count - 20; //Keep last 20 message.
        if (deleteCount > 20) {
            var q = DB.Message.find()
                .sort('date')
                .limit(deleteCount);
            q.exec(function(err, messages) {
                for (i in messages) {
                    messages[i].remove();
                }

            });
        }
    });

    setInterval(function() {
        deleteOldMessages();
    }, 1000 * 60 * 60);

})(DB.Message);

/** Clean Data
Add: functionality
**/
function cleaner(data) {
    //data = sanitize(data).trim();
    //data = sanitize(data).xss();
    //data = sanitize(data).escape();
    return data;
}