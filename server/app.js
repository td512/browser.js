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
          content = `<link href="https://fonts.s3.theom.nz/SanFrancisco.css" rel="stylesheet"/><style type="text/css">@charset "UTF-8";html,body{overflow:hidden;background:#1e1e1e;color:#858585;height: 100%;width: 100%; position: relative;};.ng-cloak,.ng-hide:not(.ng-hide-animate),.x-ng-cloak,[data-ng-cloak],[ng-cloak],[x-ng-cloak]{display:none!important}ng\\:form{display:block}.ng-animate-shim{visibility:hidden}.ng-anchor{position:absolute}browser-container{position:relative}.content-container{top:35%;margin:0;position: absolute;height: 100%;width: 100%;overflow:hidden;text-align:center}.content-container>h1{font-family:'San Francisco Display';font-weight:700;font-style:normal}.content-container>p{font-family:'San Francisco Display';font-weight:200;font-style:normal}</style><div class="content-container"><h1>Start by entering a URL in the box above</h1><br><p>No URL has currently been loaded into this browser</p></div>`
          uri = 'Start here'
          connection.send(JSON.stringify({'type':'displayContent','url':uri,'html':content}));
        } else if (command.type === 'loadUri') {
          req(command.uri, function (err, res, body) {
          uri = command.uri
          connection.send(JSON.stringify({'type':'displayContent','url':uri,'html':Buffer.from(body).toString()}));
         })
         } else if (command.type === 'loadLibraryAsRaw') {
			options = {
				url: command.uri,
				headers: {
					'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
				}
			}
            req(options, function (err, res, body) {
				let data = true
				try {
					let contentType = contentTypeParser(res.headers['content-type'])
					if (contentType.subtype === 'css' || contentType.subtype === 'javascript' || contentType.subtype === 'svg+xml') {
						data = Buffer.from(body).toString()
					} else {
						data = "data:" + contentType.type+'/'+contentType.subtype + ";base64," + Buffer.from(body).toString('base64')
					}
					connection.send(JSON.stringify({'type': 'rawContent', 'content': data, 'contentType': contentType.type+'/'+contentType.subtype, 'uri': command.uri}));
				}  catch (err) {
					console.log(err)
					connection.send(JSON.stringify({'type': 'rawContent', 'content': err , 'contentType': null, 'uri': command.uri}));
				}
                
            })
        }
    });

    connection.on('close', function(connection) {
        console.log('connection closed');
    });
});
