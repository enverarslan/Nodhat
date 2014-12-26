var path = require('path'),
    fs = require('fs'),
    mime = require('mime'),
    url = require('url'),
    qs = require('querystring'),
    DB = require('./db.js');

var Handlers = {
    staticHandler: function (req,res) {
        var publicPath = './public/',
            file = (req.url == '/') ? '/index.html' : req.url;
        file = publicPath+file;

        fs.exists(file, function(exists) {
            if (exists) {
                fs.readFile(file, function(error, content) {
                    if (error) {
                        res.writeHead(500);
                        res.end('Internal Server Error!');
                    }

                    res.writeHead(200, {
                        'Content-Type': mime.lookup(file, 'text/html')
                    });
                    res.end(content, 'utf-8');

                });
            } else {
                res.writeHead(404);
                res.end('File not found!');
            }
        });
    },
    postHandler: function(req,res){
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
    },
    login: function(username,req,res){
        DB.User.count({
            name: username
        }, function(e, count) {
            var rsp = JSON.stringify({status: (count) ? false : true});
            res.writeHead(200, {
                'Content-Length': rsp.length,
                'content-type': 'application/json'
            });
            res.write(rsp);
            res.end();
        });
    }
};
module.exports = Handlers;