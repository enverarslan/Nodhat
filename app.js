var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    path = require('path');

app.listen(1200);
io.set("browser client minification", 1);
io.set('log level', 1);

function handler(req, res) {

    var filePath = '.' + req.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.mp3':
            contentType = 'audio/mpeg';
            break;

        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.exists(filePath, function(exists) {

        if (exists) {
            fs.readFile(filePath, function(error, content) {

                if (filePath == './app.js') {
                    res.writeHead(404);
                    res.end();
                } else if (error) {
                    res.writeHead(500);
                    res.end();
                } else {
                    res.writeHead(200, {
                        'Content-Type': contentType
                    });
                    res.end(content, 'utf-8');
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });
}

var kullanicilar = {};

io.sockets.on('connection', function(socket) {

    delete kullanicilar['undefined'];

    socket.on("sunucu_kullaniciKontrol", function(kullanici) {
        kullanici = cleaner(kullanici);
        if ((typeof kullanicilar[kullanici] !== 'undefined') || kullanici === 'undefined') {
            socket.emit("istemci_kullaniciGiris", {
                giris: false
            });
        } else {

            socket.kullaniciadi = kullanici;

            // Array'e kullanıcı bilgilerini ekliyoruz
            kullanicilar[kullanici] = kullanici;

            socket.emit('istemci_sistemMesajAl', {
                yazan: "Sistem",
                mesaji: "Hoşgeldiniz!"
            });

            fs.readFile("chat.json", 'utf8', function(err, data) {
                socket.emit("gecmisiOku", data);
            });

            // Bütün kullanıcılarda Kullanıcı listesini yeniliyoruz
            io.sockets.emit("istemci_kullanicilariYenile", kullanicilar);


            socket.broadcast.emit("istemci_sistemMesajAl", {
                yazan: "Sistem",
                mesaji: socket.kullaniciadi + ' bağlandı.'
            });
            socket.emit("istemci_kullaniciGiris", {
                giris: true
            });

        }
    });

    socket.on('sunucu_mesajGonder', function(data) {
        data = cleaner(data);

        io.sockets.emit("istemci_mesajAl", {
            yazan: socket.kullaniciadi,
            mesaji: data
        });

        socket.broadcast.emit('istemci_bildirim', {
            yazan: socket.kullaniciadi
        });

        var gecmismesaj = JSON.stringify({
            yazan: socket.kullaniciadi,
            mesaji: data
        }, null, 0) + ",";
        fs.appendFile("chat.json", gecmismesaj, function(err) {});
    });


    // Bağlantı kesildiği takdirde çalışacak fonksiyon
    socket.on("disconnect", function() {
        // Kullanıcıyı listeden siliyoruz
        delete kullanicilar[socket.kullaniciadi];
        socket.broadcast.emit("istemci_sistemMesajAl", {
            yazan: "Sistem",
            mesaji: socket.kullaniciadi + ' ayrıldı.'
        });
        // Bağlı kullanıcılarda Kullanıcı listesini yeniliyoruz
        io.sockets.emit("istemci_kullanicilariYenile", kullanicilar);
    });

});

/** Clean Data
Add: functionality
**/
function cleaner(data) {
    //data = sanitize(data).trim();
    //data = sanitize(data).xss();
    //data = sanitize(data).escape();
    return data;
}