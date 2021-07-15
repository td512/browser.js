const SharedComms = new BroadcastChannel('comms')
let base = "https://localhost:8001", myUri = "https://localhost:8001", dataQueue = {}


function checkScheme(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url
    }
    return url
}

async function waitForData(url){
    while(!dataQueue[url]){
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    return dataQueue[url]
}

function doAsyncPromise(url) {
    SharedComms.postMessage(url)

    SharedComms.onmessage = function (message) {
        let context = JSON.parse(message.data)
        dataQueue[context.uri] = context
    }
    
    return new Promise(async function (fulfill, reject) {
        context = await waitForData(url)
        let content = true
        console.log(`recv: ${context.uri}`)
        if (context.contentType.includes('image') || context.contentType.includes('video') || context.contentType.includes('audio') || context.contentType.includes('font')){
            let binaryImg = atob(context.content)
            let length = binaryImg.length
            let ab = new ArrayBuffer(length)
            let ua = new Uint8Array(ab)
            for (let i = 0; i < length; i++) {
                ua[i] = binaryImg.charCodeAt(i)
            }
            content = new Blob([ab], {
                type: context.contentType
            })
        } else {
            content = atob(context.content)
        }
        fulfill(new Response(content, {headers: {'Content-Type': context.contentType}}))
    })
    
}

self.addEventListener('fetch', async function(event) {
    if (event.isReload) {
        base = "https://localhost:8001"
    }
    base_url = new URL(base)
    let url = event.request.url.replace(myUri, '')[0] === '/' ? checkScheme(base_url.origin + event.request.url.replace(myUri, '')) : event.request.url

    if (url.includes('localhost') || url.includes('s3.theom.nz') || url.includes('code.jquery.com')) {
        console.log("NOT serving request: ", url)
        event.respondWith(fetch(url))
    } else {
        console.log("Serving request:", event.request.url.replace(myUri, ''))
        event.respondWith(
            doAsyncPromise(url).then((res) => {
                return res
            })
        )
    }
})

self.addEventListener("message", function(event) {
    base = event.data
    console.log('New base URL: ' + base)
})