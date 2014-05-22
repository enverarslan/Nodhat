var path = require('path'),
    fs = require('fs'),
    url = require('url'),
    qs = require('querystring'),
    DB = require('./db.js');

function staticHandler(req, res) {
    var filePath = '.' + req.url;

    if (filePath == './') filePath = './index.html';
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/png';
            break;
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
        default:
            contentType = 'text/html';
            break;
    }
    fs.exists(filePath, function(exists) {
        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    res.writeHead(500);
                    res.end();
                }
                if (filePath == './app.js') {
                    res.writeHead(404);
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

function postHandler(req, res) {
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('end', function() {
        var pathname = url.parse(req.url, 1).path;
        var POST = qs.parse(body);

        switch (pathname) {
            case '/login':
                Handlers.login(POST.user, req, res);
                break;
            default:
                res.writeHead(200);
                res.write(JSON.stringify(POST));
                res.end();
                break;

        }
    });
}

function login(username, req, res) {
    DB.User.count({
        name: username
    }, function(e, count) {
        var rsp = '';
        if (count) {
            rsp = JSON.stringify({
                status: false
            });
        } else {
            rsp = JSON.stringify({
                status: true
            });
        }
        res.writeHead(200, {
            'Content-Length': rsp.length,
            'content-type': 'application/json'
        });
        res.write(rsp);
        res.end();
    });

}



module.exports = Handlers = {
    staticHandler: staticHandler,
    postHandler: postHandler,
    login: login
};