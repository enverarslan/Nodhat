var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    Handlers = require('./lib/handlers.js'),
    settings = require('./config/host').settings(),
    DB = require('./lib/db');

/* Listen app with configs. */
app.listen(settings.server.port, settings.server.host);

/* Socket.io configs */
io.set("browser client minification", 1);
io.set('log level', 1);

/* Server Handler
 *
 * Process requests.
 * Serve Static Files
 *
 */
function handler(req, res) {
    /* POST METHOD */
    if (req.method == "POST") {
        Handlers.postHandler(req, res);
    } else {
        Handlers.staticHandler(req, res);
    }
}

/* Socket Processes
 * All communications is here.
 *
 *
 */
io.sockets.on('connection', function(socket) {

    /* Messager
     *
     * For simple development and single responsibility,
     * keeps main processes in this object.
     *
     */

    var messager = {};

    /* Attempt Login
     * Attempts user login with new or exist user.
     *
     * @Processes findUser or addUser
     *
     */
    messager.attemptLogin = function(user, cb) {
        (user.id) ? messager.findUser(user, cb) : messager.addUser(user, cb);
    };

    /* Find User 
     *
     * Finds User informations to DB.
     * @Model: User
     *
     *
     */
    messager.findUser = function(user, cb) {
        DB.User.findOne({
            name: user.name
        }, function(err, u) {
            if (err) return;
            if (cb) return cb(u);
        });
    };

    /* Add User 
     *
     * Adds User informations to DB.
     * @Model: User
     *
     *
     */
    messager.addUser = function(user, cb) {
        //if(typeof user.id == )
        var u = new DB.User({
            name: user.name
        });
        u.save(function(err) {
            if (err) return;
            if (cb) return cb(u);
        });
    };

    /* Login After Filter
     *
     * Works when user login on chat.
     * If user relogin skipped next processes.
     *
     * Processes: updateOnlines, getRecentMessages and callback...
     * @Emitters: client.system.message
     *
     *
     */
    messager.loginAfter = function(user, cb) {
        messager.updateOnlines(function() {
            if (!user.id) {
                messager.getRecentMessages(function() {
                    socket.broadcast.emit("client.system.message", {
                        user: "Sistem",
                        message: socket.user.name + ' connected.'
                    });
                    if (cb) return cb();
                });
            } else {
                if (cb) return cb();
            }
        });
    };

    /* Logout After Filter
     *
     * Processes: UpdateOnlines.
     * @Emitters: client.system.message
     *
     *
     */
    messager.logoutAfter = function() {
        messager.updateOnlines(function() {
            socket.broadcast.emit("client.system.message", {
                message: socket.user.name + ' disconnected.'
            });
        });
    };

    /* Online Users Updater 
     *
     * Get Online Users
     * @Model: User
     * @Emitters: client.updateUsers
     *
     *
     */
    messager.updateOnlines = function(cb) {
        DB.User.find({}, function(err, users) {
            io.sockets.emit("client.updateUsers", users);
            if (cb) return cb();
        });
    };

    /* History Reader
     *
     * Get recent 20 messages from DB.
     * @Model: Message
     * @Emitters: history.read
     *
     *
     */
    messager.getRecentMessages = function(cb) {
        DB.Message.find({}).sort({
            date: -1
        }).limit(20).exec(function(err, messages) {
            socket.emit("history.read", messages);
            if (cb) return cb();
        });
    };

    /* Message Sender
     *
     * Sends message to all users,
     * Notifications to subscribers.
     * @Model Message
     * @Emitters: client.message.get, client.notification.message.send
     *
     *
     */
    socket.on('client.message.send', function(data) {
        io.sockets.emit("client.message.get", {
            user: socket.user.name,
            message: data
        });
        socket.broadcast.emit('client.notification.message.send');
        new DB.Message({
            user: socket.user.name,
            message: data
        }).save();
    });

    /* User Login
     *
     * If user relogin so server crashed and again refreshed,
     * we use 'user' object on loginAfter filter
     * for keep user session with same user informations.
     *
     * @Processes: attemtLogin
     * @Emitters: login.after
     *
     *
     */
    socket.on("login", function(user) {
        messager.attemptLogin(user, function(loggedinUser) {
            socket.user = {
                id: loggedinUser._id,
                name: loggedinUser.name
            };
            socket.emit("login.after", socket.user);
            messager.loginAfter(user);
        });
    });

    /* Socket Disconnected 
     *
     * Delete User Form DB. Notify other users...
     *
     * @Model User
     * @Processes: logoutAfter
     *
     *
     */
    socket.on("disconnect", function() {
        if (typeof socket.user !== "undefined" && socket.user) {
            DB.User.findById(socket.user.id, function(err, user) {
                if (err) next();
                user.remove();
                messager.logoutAfter();
            });
        }

    });
});

/* Delete Old Message from MongoDB.
 *
 * Run one time immediately, after run with setInterval timer.
 * @time 1 hour.
 * @deleteCount All messages except last 20 messages.
 *
 *
 */
(function() {
    function deleteOldMessages() {
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
    }
    deleteOldMessages();
    setInterval(function() {
        deleteOldMessages();
    }, 1000 * 60 * 60);
})(DB.Message);