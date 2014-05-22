(function() {
    var chatter = {},
        socket;

    chatter.User = {};

    chatter.socketter = function(username, id) {
        socket = io.connect("http://localhost:1200");
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
                $("#uyari").remove();
                $("#giris").animate({
                    left: "+=5%"
                }, 500).animate({
                    left: "-=100%"
                }, 1000, function() {
                    $(this).remove();
                    $("#users, #main").fadeIn();
                    $("#mesajlar").stop().animate({
                        scrollTop: $("#mesaj").height()
                    }, 100);
                    $("#icerik").focus();
                });
                chatter.User.id = data.id;
                window.LOGIN = true;
            }
        });

        /* Get Messages */

        socket.on("client.message.get", function(mesaj) {
            chatter.mesajYaz(mesaj);
        });

        socket.on("client.system.message", function(mesaj) {
            chatter.mesajYaz(mesaj, 1);
        });

        socket.on("client.notification.message.send", function() {
            chatter.bildirim()
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
            $container = $("ul#mesaj");
            messages = messages.reverse(); // Because Last message must be bottom in container
            $.each(messages, function(c, m) {
                $container.append("<li><span class='username'>" + m.user + "</span> : <span class='message'>" + urlize(m.message, "nofollow", 1, 50, "_blank") + "</span></li>");
            });

            $container.append("<li class='system'><span class='message'>Welcome!, say Hi to strangers!</span></li>");
        });
    };
    chatter.animator = function() {
        $("#mesajlar").stop().animate({
            scrollTop: $("#mesaj").height()
        }, 500);
        $("ul#mesaj li").last().animate({
            backgroundColor: "#2f3238"
        });
        $("ul#mesaj li").last().animate({
            backgroundColor: "#1D1F21"
        });
    };
    chatter.mesajYaz = function(message, tip) {
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
        $("ul#mesaj").append(tpl);
        chatter.animator();
    };

    chatter.mesajGonder = function() {
        var mesaj = $.trim($("#icerik").val());
        if (mesaj == "") {
            return;
        } else if (mesaj.length > 200) {
            return alert("Please write less!");
        } else if (!chatter.User.id) {
            return;
        } else {
            $("#icerik").val("");
            socket.emit("client.message.send", mesaj);
        }
    };

    chatter.bildirim = function() {
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
    }

    /* Message */

    //Enter 	
    $(document).on("keypress", "#icerik", function(e) {
        if (e.which == 13) {
            chatter.mesajGonder();
        }
    });
    // Button
    $(document).on("click", "#gonder", function() {
        chatter.mesajGonder();
    });

    /* Login */
    chatter.login = function() {
        var validation = true;
        var input = $("#username");
        var misafir = $.trim(input.val());

        //console.log(misafir);

        if (misafir === "") {
            $("#uyari").html("Please enter your nick!");
            validation = false;
            allowAction();
        } else if (misafir.length > 15) {
            $("#uyari").html("Nickname is not be more than 15 characters!");
            allowAction();
            validation = false;
        } else if (validation == true) {
            preventDouble();
            $.ajax({
                type: "POST",
                url: '/login',
                data: {
                    user: misafir
                },
                error: function(e) {
                    console.log(e);
                },
                success: function(data) {
                    if (data.status) {
                        $("#uyari").html("You are in yo! Please wait...");
                        setTimeout(function() {
                            chatter.socketter(misafir);
                        }, 1000);
                    } else {
                        $("#uyari").html("Nick exist, choose another!");
                        allowAction();
                    }
                },
            });

        }

        function preventDouble() {
            $("#loginButton, #username").prop("disabled", true);
        }

        function allowAction() {
            $("#loginButton, #username").prop("disabled", false);
        }
        return false;
    };
    /* Document Ready */
    $(function() {
        $("#username").focus();
        /* Login */
        $("#loginButton").click(function(e) {
            e.preventDefault();
            return chatter.login();
        });
        $("#username").on("keypress", function(e) {
            if (e.which == 13) {
                e.preventDefault();
                return chatter.login();
            }
        });
    });

    /* Exit */
    window.onbeforeunload = function() {
        return "Are You Exit?";
    };

})(window, document, io, $);