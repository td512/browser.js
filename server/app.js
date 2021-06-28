var server = require('websocket').server, http = require('http'), https = require('https'), req = require('request').defaults({ encoding: null }),
    contentTypeParser = require("content-type-parser"), request = require('request');

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
          request(command.uri, function (err, res, body) {
          uri = command.uri
          connection.send(JSON.stringify({'type':'displayContent','url':uri,'html':res.body}));
         })
         } else if (command.type === 'loadLibraryAsRaw') {
            req(command.uri, function (err, res, body) {
                let contentType = contentTypeParser(res.headers['content-type'])
                connection.send(JSON.stringify({'type': 'rawContent', 'content': Buffer.from(body).toString('base64'), 'contentType': contentType.type+'/'+contentType.subtype}));
            })
        }
    });

    connection.on('close', function(connection) {
        console.log('connection closed');
    });
});
