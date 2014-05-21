// Global
var socket, io;

var Chat = (function(username, login) {

    var User = {
        name: username,
        login: (login) ? 1 : 0
    };

    // Zaten oturum açtıysa 2. bir örneği oluşturma.
    if (typeof User.login != 'undefined' && User.login) return;

    // Sunucuya bağlan.
    var socket = io.connect("http://localhost:1200"),
        chatter = this; // Fix.

    socket.on('connect', function() {
        socket.emit('login', User);
    });

    socket.on('login.after', function(data) {

        if (User.login) {
            chatter.statusViewer('connected');
        } else { //First Login
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


            User.login = true;
            window.LOGIN = true;
        }



    });

    /* Mesaj Gönder */

    socket.on("istemci_mesajAl", function(mesaj) {
        chatter.mesajYaz(mesaj);
    });

    socket.on("istemci_sistemMesajAl", function(mesaj) {
        chatter.mesajYaz(mesaj, 1);
    });

    socket.on("istemci_bildirim", function(mesaj) {
        chatter.bildirim();
    });


    socket.on("istemci_kullanicilariYenile", function(users) {
        $container = $("#users_list");
        $container.empty();
        $.each(users, function(c, user) {
            $container.append("<li><i class='fa fa-user'></i> <span>" + user.name + "</span></li>");
        });
        $("section#users h3 .users_count").html(users.length);
    });

    /* Geçmişi oku || JSON dosyasını Redis ya da MongoDB'ye çevir.*/
    socket.on("gecmisiOku", function(messages) {
        $container = $("ul#mesaj");
        messages = messages.reverse(); // Because Last message must be bottom in container
        $.each(messages, function(c, m) {
            $container.append("<li><span class='username'>" + m.user + "</span> : <span class='message'>" + urlize(m.message, "nofollow", 1, 50, "_blank") + "</span></li>");
        });

        $container.append("<li class='system'><span class='message'>Welcome!, say Hi to strangers!</span></li>");
    });




    this.animator = function() {
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

    this.mesajYaz = function(message, tip) {
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

    this.mesajGonder = function() {
        var mesaj = $.trim($("#icerik").val());
        if (mesaj == "") {
            return;
        } else if (mesaj.length > 200) {
            return alert("Please write less!");
        } else if (!User.login) {
            return;
        } else {
            $("#icerik").val("");
            socket.emit("sunucu_mesajGonder", mesaj);
        }
    };

    this.bildirim = function() {
        var sound = document.getElementById('audio');
        sound.load();
        sound.play();
        return false;
    };

    this.statusViewer = function(type) {
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

        if (type) {

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

    socket.on('disconnect', function() {
        chatter.statusViewer('disconnected');

        try {
            new Chat(User.name, 1);
        } catch (e) {

        }

    });

}); // Chat Ended.

/* Login */
function login() {
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
                        new Chat(misafir);
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
}

$(function() {
    $("#username").focus();

    /* Login */
    $("#loginButton").click(function(e) {
        e.preventDefault();
        return login();
    });
    $("#username").on("keypress", function(e) {
        if (e.which == 13) {
            e.preventDefault();
            return login();
        }
    });

});

/* Exit */
window.onbeforeunload = function() {
    if (LOGIN)
        return "Are You Exit?";
};