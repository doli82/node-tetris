export default function createNetworkListener () {
    const state = {
        observers: []
    };
    function subscribe( observerFunction ) {
        state.observers.push( observerFunction );
    }

    function notifyAll( command ) {
        state.observers.forEach( observerFunction => observerFunction( command ) );
    }

    const websocket = new WebSocket('ws://localhost:3300/');
    websocket.onopen = function () {
        // websocket.send('Ping'); // Send the message 'Ping' to the server
       websocket.send(JSON.stringify({ type: 'register', name: 'Daniel' }))
    };

    // Log errors
    websocket.onerror = function (error) {
        websocket.log('WebSocket Error ' + error);
    };

    // Log messages from the server
    websocket.onmessage = function (e) {
        websocket.log('Server: ' + e.data);
    };
}