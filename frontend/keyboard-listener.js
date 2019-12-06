export default function createKeyboardListener() {
    const state = {
        observers: []
    };

    function subscribe( observerFunction ) {
        state.observers.push(observerFunction);
    }

    function notifyAll( command ) {
        state.observers.forEach( observerFunction => observerFunction( command ) );
    }

    document.addEventListener('keydown', (event) => {
       const keyPressed = event.key;
       const command = {
         keyPressed
       };
       notifyAll( command );
    });

    return {
        subscribe
    }
}