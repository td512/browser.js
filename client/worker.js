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
                fulfill(new Response(context.content, { headers: { 'Content-Type': context.contentType }}))
            }
        }
    });
}

var base = "https://browserjs.s3.theom.nz"

self.addEventListener('fetch', async function(event) {
    if (event.isReload) {
        base = "https://browserjs.s3.theom.nz"
    }
    var url = event.request.url.replace('https://browserjs.s3.theom.nz', '')[0] === '/' ? checkScheme(base+event.request.url.replace('https://browserjs.s3.theom.nz', '')) : event.request.url

    if (url.includes('localhost') || url.includes('s3.theom.nz') || url.includes('code.jquery.com')) {
        console.log("NOT serving request: ", url)
        event.respondWith(fetch(url))
    } else {
        console.log("Serving request:", event.request.url.replace('http://browserjs.s3.theom.nz', ''));
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