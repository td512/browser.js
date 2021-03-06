// registers a service worker. I'm not going to explain it, because I don't understand how it works
if ('serviceWorker' in navigator) {
    let interceptorLoaded = navigator.serviceWorker.controller != null;
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('worker.js')
            .then(function(registration){
                    console.log('ServiceWorker registered successfully with scope: ', registration.scope)
                    if(!interceptorLoaded){
                        window.location = window.location.href
                    }
                },
                function(err) {
                    console.log('ServiceWorker registration failed: ', err)
                })
    })
}