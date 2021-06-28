function checkScheme(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
    return url;
}

function doAsyncPromise(url) {
    return new Promise(function (fulfill, reject) {
        console.log("fired")
        var ws = new WebSocket('ws://localhost:8000');
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
                fulfill(context.content)
            }
        }
    });
}

var base = "http://localhost:8001"

self.addEventListener('fetch', async function(event) {
    var url = event.request.url.replace('http://localhost:8001', '')[0] === '/' ? checkScheme(base+event.request.url.replace('http://localhost:8001', '')) : event.request.url

    if (url.includes('localhost') || url.includes('s3.theom.nz') || url.includes('code.jquery.com')) {
        console.log("NOT serving request: ", url)
        event.respondWith(fetch(url))
    } else {
        console.log("Serving request:", event.request.url.replace('http://localhost:8001', ''));
        event.respondWith(
            doAsyncPromise(url).then((res) => {
                return new Response(res)
            })
        )
    }
})

self.addEventListener("message", function(event) {
    base = event.data;
    console.log('New base URL: ' + base)
});