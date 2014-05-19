// Global değişkenler.
var socket, io;

var Chat = (function(kullaniciadi) {

    // Zaten oturum açtıysa 2. bir örneği oluşturma.
    if (window.login) throw "Zaten giriş yapmış görünüyorsunuz!";

    // Sunucuya bağlan.
    var socket = io.connect("http://localhost:1200"),
        chatter = this; // Fix.

    /* Giriş İşlemleri */
    socket.emit("sunucu_kullaniciKontrol", kullaniciadi);

    socket.on("istemci_kullaniciGiris", function(a) {
        if (!a.giris) {
            $("#uyari").html("Kullanıcı adı mevcut!");
        } else {

            $("#uyari").remove();

            $("#giris").animate({
                left: "-=100%"
            }, 1500, function() {
                $(this).remove();
                $("#users, #main").fadeIn();
                $("#mesajlar").stop().animate({
                    scrollTop: $("#mesaj").height()
                }, 100);
            });

            window.login = true;

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


    socket.on("istemci_kullanicilariYenile", function(kullanicilar) {
        $("#kullanicilar").empty();
        var sayi = 0;
        $.each(kullanicilar, function(c, kullanici) {
            $("#kullanicilar").append("<p>" + kullanici + "</p>");
            sayi++;
        });
        $("section#users h3").html("Çevrimiçi kullanıcılar(" + sayi + ")");
    });

    /* Geçmişi oku || JSON dosyasını Redis ya da MongoDB'ye çevir.*/
    socket.on("gecmisiOku", function(mesajlar) {
        mesajlar = mesajlar.substring(0, mesajlar.length - 1);
        mesajlar = jQuery.parseJSON("[" + mesajlar + "]");
        $.each(mesajlar, function(c, m) {
            $("ul#mesaj").append("<li><span class='username'>" + m.yazan + "</span> : <span class='message'>" + urlize(m.mesaji, "nofollow", 1, 50, "_blank") + "</span></li>");
        });
    });

    this.animator = function() {
        $("#mesajlar").stop().animate({
            scrollTop: $("#mesaj").height()
        }, 500);
        $("ul#mesaj li").last().animate({
            backgroundColor: "#F5F240"
        });
        $("ul#mesaj li").last().animate({
            backgroundColor: "#FAFAFA"
        });
    };

    this.mesajYaz = function(mesaj, tip) {
        if (mesaj.mesaji.length > 200) {
            return false
        }
        if (tip === undefined || tip === null) tip = 0;
        switch (tip) {
            case 1:
                tip = 'system';
                break;
            default:
                tip = 'user';
                break;
        }

        var tpl = "<li class='" + tip + "'><span class='username'>" +
            mesaj.yazan + "</span> : <span class='message'>" +
            urlize(mesaj.mesaji, "nofollow", 1, 50, "_blank") +
            "</span></li>";

        $("ul#mesaj").append(tpl);
        $("#icerik").val("");
        chatter.animator();

    };

    this.mesajGonder = function() {
        var mesaj = $.trim($("#icerik").val());
        var a = new Date().getSeconds();
        if (mesaj === "") {
            return;
        } else if (mesaj.length > 200) {
            return alert("200 karakterden daha uzun mesajlar göndermezsiniz!");
        } else {
            socket.emit("sunucu_mesajGonder", mesaj);
        }
    };

    this.bildirim = function() {
        var sound = document.getElementById('audio');
        sound.load();
        sound.play();
        return false;
    }

    /* Mesaj Gönderme */

    //Enter ile gönder 	
    $(document).on("keypress", "#icerik", function(e) {
        if (e.which == 13) {
            chatter.mesajGonder();
        }
    });
    // Buton ile gönder
    $(document).on("click", "#gonder", function() {
        chatter.mesajGonder();
    });

});

/* Giriş Yapma */

$(document).on("keypress", "#kullanici", function(e) {
    if (e.which === 13) {
        e.preventDefault();
        var misafir = $.trim($("#kullanici").val());
        if (misafir === "" || misafir === "undefined") {
            $("#uyari").html("Kullanıcı adı boş olamaz!");
        } else if (misafir.length > 15) {
            $("#uyari").html("15 karakterden daha uzun kullanıcı adı alamazsınız!");
        } else if (misafir === "Sistem") {
            $("#uyari").html("Farklı bir kullanıcı adi seçin.");
        } else {
            $("#uyari").html("Giriş yapılıyor, lütfen bekleyin...");
            new Chat(misafir);
        }
        return false;
    }
});

/* Çıkış sorusu */
window.onbeforeunload = function() {
    if (login)
        return "Oturumu kapatmak istediğinizden emin misiniz?";
};

$(function() {

});