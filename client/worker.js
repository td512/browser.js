// open the comms BroadcastChannel
const SharedComms = new BroadcastChannel('comms')
// on initial load set the base URLs, and instantiate objects that need to be created
let base = "http://localhost:8001", myUri = "http://localhost:8001", dataQueue = {}

// this is the same function as addhttp in the client side script
function checkScheme(url) {
    // checkScheme ingests a URL and uses a regex test to check if the url has http:// or https:// in the URL sent, and
    // modifies the URL on the fly. This is done to avoid breaking the server
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url
    }
    return url
}

async function waitForData(url){
    // waitForData exploits JavaScript promises by checking for the dataqueue[url]
    // and if it doesn't exist awaits a new promise that will eventually resolve
    // when the data finally arrives. This was added because requests would resolve in the wrong order
    // and return junk data
    while(!dataQueue[url]){
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    // because of the way promise awaits work, by the time we get down here, the data already exists, so we don't need
    // to check for it, since it's guaranteed to exist
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
        base = "http://localhost:8001"
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

// on data posted to us by the client side...
self.addEventListener("message", function(event) {
    // DEBUG: update the base URL, and log it
    base = event.data
    console.log('New base URL: ' + base)
})