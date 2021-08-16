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
    // doAsyncPromise ingests a URL and returns a resolved promise rendering usable data to the caller
    SharedComms.postMessage(url)

    // on a message from the SharedComms channel...
    SharedComms.onmessage = function (message) {
        // parse the message data, and set up the dataQueue
        let context = JSON.parse(message.data)
        dataQueue[context.uri] = context
    }

    // returns a new promise
    return new Promise(async function (fulfill, reject) {
        // wait for data for the URL to be populated. This line is very important to preventing requests firing in the wrong order
        context = await waitForData(url)
        let content = true
        // if the contentType includes these types...
        if (context.contentType.includes('image') || context.contentType.includes('video') || context.contentType.includes('audio') || context.contentType.includes('font')){
            // convert it back into binary data
            let binaryImg = atob(context.content)
            let length = binaryImg.length
            let ab = new ArrayBuffer(length)
            let ua = new Uint8Array(ab)
            for (let i = 0; i < length; i++) {
                ua[i] = binaryImg.charCodeAt(i)
            }
            // and then into a blob object
            content = new Blob([ab], {
                type: context.contentType
            })
            // otherwise...
        } else {
            // Base64 decode the content...
            content = atob(context.content)
        }
        // and fulfill the request
        fulfill(new Response(content, {headers: {'Content-Type': context.contentType}}))
    })
    
}

// Adds an event listener for new fetches
self.addEventListener('fetch', async function(event) {
    // if we're reloading the window, reset the base URL
    if (event.isReload) {
        base = "http://localhost:8001"
    }
    // otherwise, parse the base URL
    base_url = new URL(base)
    //
    let url = event.request.url.replace(myUri, '')[0] === '/' ? checkScheme(base_url.origin + event.request.url.replace(myUri, '')) : event.request.url

    // if the URL includes these values...
    if (url.includes('localhost') || url.includes('s3.theom.nz') || url.includes('code.jquery.com')) {
        // DEBUG: log that we're not serving the request
        console.log("NOT serving request: ", url)
        // and respond with a fetch, letting the browser fetch the URL
        event.respondWith(fetch(url))
    } else {
        // DEBUG: log that we're serving the request
        console.log("Serving request:", event.request.url.replace(myUri, ''))
        // and respond with an async promise, which when resolved returns the correct data
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