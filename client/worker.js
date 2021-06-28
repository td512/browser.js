self.addEventListener('fetch', function(event) {
    console.log("REQUEST:", event.request.url);
    var url = event.request.url;
    if (url.endsWith("/jquery.js")) {
        event.respondWith(
            fetch('https://code.jquery.com/jquery-3.3.1.js')
        );
    } else if(url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".gif")){
        event.respondWith(fetch("https://i.imgur.com/"+url.substring(url.lastIndexOf("/")+1),{
            mode: 'cors',
        }));
    }
})