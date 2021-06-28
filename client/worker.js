function checkScheme(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
    return url;
}

base = "http://localhost:8001"

self.addEventListener('fetch', async function(event) {
    console.log("Serving request:", event.request.url.replace('http://localhost:8001', ''));
    var url = event.request.url.replace('http://localhost:8001', '')[0] === '/' ? checkScheme(base+event.request.url.replace('http://localhost:8001', '')) : event.request.url

    var ws = new WebSocket('ws://127.0.0.1:8000');
    ws.onopen = function () {
        ws.send(JSON.stringify({'type': 'loadLibraryAsRaw', 'uri': url}))
    }

    ws.onerror = function (error) {
        console.log('WebSocket error: ' + error);
    };
    ws.onmessage = function (message) {
        context = JSON.parse(message.data)
        if (context.type === "rawContent") {
            event.respondWith(context.content)
        }
    }

})

self.addEventListener("message", function(event) {
    base = event.data;
    console.log('New base URL: ' + base)
});