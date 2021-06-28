var server = require('websocket').server, http = require('http'), https = require('https'), req = require('request').defaults({ encoding: null }), contentTypeParser = require("content-type-parser");

const PORT = process.env.PORT || 8000;

var socket = new server({  
    httpServer: http.createServer().listen(PORT)
});

socket.on('request', function(request) {  
    var connection = request.accept(null, request.origin);

    connection.on('message', function(message) {
        let command = JSON.parse(message.utf8Data)
        let content = ""
        console.log(command)
        if (command.type === 'init') {
          content = `<div class="content-container"><h1>Start by entering a URL in the box above</h1><br><p>No URL has currently been loaded into this browser</p></div>`
          uri = 'Start here'
          connection.send(JSON.stringify({'type':'displayContent','url':uri,'html':content}));
        } else if (command.type === 'loadUri') {
          req(command.uri, function (err, res, body) {
          uri = command.uri
          connection.send(JSON.stringify({'type':'displayContent','url':uri,'html':Buffer.from(body).toString()}));
         })
         } else if (command.type === 'loadLibraryAsRaw') {
            req(command.uri, function (err, res, body) {
                let contentType = contentTypeParser(res.headers['content-type'])
                if (contentType.subtype === 'css' || contentType.subtype === 'javascript' || contentType.subtype === 'svg+xml') {
                    data = Buffer.from(body).toString()
                } else {
                    let data = "data:" + contentType.type+'/'+contentType.subtype + ";base64," + Buffer.from(body).toString('base64')
                }
                connection.send(JSON.stringify({'type': 'rawContent', 'content': data, 'contentType': contentType.type+'/'+contentType.subtype}));
            })
        }
    });

    connection.on('close', function(connection) {
        console.log('connection closed');
    });
});
