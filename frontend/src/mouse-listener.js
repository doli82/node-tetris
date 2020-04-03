export default function createMouseListener() {
    const state = {
        observers: []
    };

    function subscribe( observerFunction ) {
        state.observers.push(observerFunction);
    }

    function notifyAll( command ) {
        state.observers.forEach( observerFunction => observerFunction( command ) );
    }

    document.addEventListener('click', (event) => {
        const {pageX, pageY} = event;
        const command = { pageX, pageY };
        notifyAll( command );
    });

    return {
        subscribe
    };
}