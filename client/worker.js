function checkScheme(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
    return url;
}

function doAsyncPromise(url) {
    return new Promise(function (fulfill, reject) {
        console.log("fired")
        var ws = new WebSocket('wss://browserjs.herokuapp.com');
        ws.onopen = function () {
            console.log('sent')
            ws.send(JSON.stringify({'type': 'loadLibraryAsRaw', 'uri': url}))
        }

        ws.onerror = function (error) {
            console.log('WebSocket error: ' + error);
        };
        ws.onmessage = function (message) {
            console.log('recv')
            context = JSON.parse(message.data)
            if (context.type === "rawContent") {
                content = true
                if (context.contentType.includes('image') || context.contentType.includes('video') || context.contentType.includes('audio') || context.contentType.includes('font')){
                    var binaryImg = atob(context.content);
                    var length = binaryImg.length;
                    var ab = new ArrayBuffer(length);
                    var ua = new Uint8Array(ab);
                    for (var i = 0; i < length; i++) {
                        ua[i] = binaryImg.charCodeAt(i);
                    }
                    var content = new Blob([ab], {
                        type: context.contentType
                    })
                } else {
                    content = atob(context.content)
                }
                fulfill(new Response(content, { headers: { 'Content-Type': context.contentType }}))
            }
        }
    });
}

var base = "https://browserjs-public-beta.s3.theom.nz"

self.addEventListener('fetch', async function(event) {
    if (event.isReload) {
        base = "https://browserjs-public-beta.s3.theom.nz"
    }
    var url = event.request.url.replace('https://browserjs-public-beta.s3.theom.nz', '')[0] === '/' ? checkScheme(base+event.request.url.replace('https://browserjs-public-beta.s3.theom.nz', '')) : event.request.url

    if (url.includes('localhost') || url.includes('s3.theom.nz') || url.includes('code.jquery.com')) {
        console.log("NOT serving request: ", url)
        event.respondWith(fetch(url))
    } else {
        console.log("Serving request:", event.request.url.replace('https://browserjs-public-beta.s3.theom.nz', ''));
        event.respondWith(
            doAsyncPromise(url).then((res) => {
                return res
            })
        )
    }
})

self.addEventListener("message", function(event) {
    base = event.data;
    console.log('New base URL: ' + base)
});