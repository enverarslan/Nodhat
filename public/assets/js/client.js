(function() {
    var chatter = {},
        socket;

    chatter.User = {};

    chatter.socketter = function(username, id) {
        socket = io.connect("http://10.0.33.34:1200");
        chatter.User = {
            name: username,
            id: (id) ? id : undefined
        };
        socket.on('connect', function() {
            socket.emit('login', chatter.User);
        });
        socket.on('disconnect', function() {
            chatter.statusViewer('disconnected');
        });
        socket.on('login.after', function(data) {
            if (chatter.User.id) {
                chatter.statusViewer('connected');
            } else {
                chatter.User.id = data.id;
                chatter.removeLoginBox();
            }
        });

        /* Get Messages */
        socket.on("client.message.get", function(message) {
            chatter.writeMessage(message);
        });

        socket.on("client.system.message", function(message) {
            chatter.writeMessage(message, 1);
        });

        socket.on("client.notification.message.send", function() {
            chatter.notification()
        });
        socket.on("client.updateUsers", function(users) {
            $container = $("#users_list");
            $container.empty();
            $.each(users, function(c, user) {
                $container.append("<li><i class='fa fa-user'></i> <span>" + user.name + "</span></li>");
            });
            $("section#users h3 .users_count").html(users.length);
        });
        /* History Read */
        socket.on("history.read", function(messages) {
            $container = $(".messages ul");
            messages = messages.reverse(); // Because Last message must be bottom in container
            $.each(messages, function(c, m) {
                $container.append("<li><span class='username'>" + m.user + "</span> : <span class='message'>" + urlize(m.message, "nofollow", 1, 50, "_blank") + "</span></li>");
            });

            $container.append("<li class='system'><span class='message'>Welcome!, say Hi to strangers!</span></li>");
        });
    };
    chatter.animator = function() {
        $(".messages").stop().animate({
            scrollTop: $(".messages ul").height()
        }, 500);
        $(".messages ul li").last().animate({
            backgroundColor: "#2f3238"
        });
        $(".messages ul li").last().animate({
            backgroundColor: "#1D1F21"
        });
    };
    chatter.removeLoginBox = function(){
        $(".alert").remove();
        $("#login").animate({
            left: "+=5%"
        }, 500).animate({
            left: "-=100%"
        }, 1000, function() {
            $(this).remove();
            $("#users, #main").fadeIn();
            $(".messages").stop().animate({
                scrollTop: $(".messages ul").height()
            }, 100);
            $("#message").focus();
        });
    };
    chatter.writeMessage = function(message, tip) {
        if (message.message.length > 200) {
            return false
        }
        if (tip === undefined || tip === null) tip = 0;
        switch (tip) {
            case 1:
                tip = 'system';
                var tpl = "<li class='" + tip + "'><span class='message'>" +
                    urlize(message.message, "nofollow", 1, 50, "_blank") +
                    "</span></li>";
                break;
            default:
                tip = 'user';
                var tpl = "<li class='" + tip + "'><span class='username'>" +
                    message.user + "</span> : <span class='message'>" +
                    urlize(message.message, "nofollow", 1, 50, "_blank") +
                    "</span></li>";
                break;
        }
        $(".messages ul").append(tpl);
        chatter.animator();
    };

    chatter.sendMessage = function() {
        var message = $.trim($("#message").val());
        if (message == "") {
            return;
        } else if (message.length > 200) {
            return alert("Please write less!");
        } else if (!chatter.User.id) {
            return alert('You must make login!');
        } else {
            $("#message").val("");
            socket.emit("client.message.send", message);
        }
    };

    chatter.notification = function() {
        var sound = document.getElementById('audio');
        sound.load();
        sound.play();
        return false;
    };

    chatter.statusViewer = function(type) {
        $statusBar = $(".status");

        switch (type) {
            case 'connected':
                $statusBar.attr('title', 'Connected, lets talk!').animate({
                    backgroundColor: "#9fbb58"
                });
                break;
            case 'disconnected':
                $statusBar.attr('title', 'Disconnected, please wait...').animate({
                    backgroundColor: "#e64b50"
                });
                break;
            case 'idle':
                break;
            default:
                break;
        }
    };

    /* Login */
    chatter.login = function() {
        var validation = true;
        var input = $("#username");
        var username = $.trim(input.val());
        if (username === "") {
            $(".alert").html("Please enter your nick!");
        } else if (username.length > 15) {
            $(".alert").html("Nickname is not be more than 15 characters!");
        } else{
            $.ajax({
                type: "POST",
                url: '/login',
                data: {
                    user: username
                },
                error: function(e) {
                    console.log(e);
                },
                success: function(data) {
                    if (data.status) {
                        $(".alert").html("You are in yo! Please wait...");
                        setTimeout(function() {
                            chatter.socketter(username);
                        }, 1000);
                    } else {
                        $(".alert").html("Nick exist, choose another!");
                    }
                }
            });

        }
        return false;
    };

    /* Document Ready */
    $(function() {

        /* Login */
        $("#username").focus();
        $("#loginForm").on('submit', function (e) {
            e.preventDefault();
            return chatter.login();
        });

        /* Message */
        $('#message-form').on('submit', function(e){
            e.preventDefault();
            return chatter.sendMessage();
        });
    });

    /* Exit */
    window.onbeforeunload = function() {
        if(chatter.User.id) return "Do you really want to exit?";
    };

})(window, document, io, $);