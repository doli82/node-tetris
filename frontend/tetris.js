export default function createGame(width=200, height=500) {
    const cols = 10;
    const rows = 20;
    const block_width = width / cols;
    const block_height = height / rows;

    let interval;
    let paused = false;
    let gameOver = false;

    const players = [
        { name: 'Daniel', score: 0 },
        { name: 'Gabriel', score: 0 },
    ];

    const board = [];
    const shapes = [
        [ 1, 1, 1, 1 ],
        [ 1, 1, 1, 0, 1 ],
        [ 1, 1, 1, 0, 0, 0, 1 ],
        [ 1, 1, 0, 0, 1, 1 ],
        [ 1, 1, 0, 0, 0, 1, 1 ],
        [ 0, 1, 1, 0, 1, 1 ],
        [ 0, 1, 0, 0, 1, 1, 1 ]
    ];

    const currentShape = {
        data: [],
        freezed: false,
        position: {
            x: undefined,
            y: undefined
        }
    };

    function valid( offsetX, offsetY, newCurrent ) {
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        offsetX = currentShape.position.x + offsetX;
        offsetY = currentShape.position.y + offsetY;
        newCurrent = newCurrent || currentShape.data;

        for ( let y = 0; y < 4; ++y ) {
            for ( let x = 0; x < 4; ++x ) {
                if ( newCurrent[ y ][ x ] ) {
                    if ( typeof board[ y + offsetY ] === 'undefined'
                        || typeof board[ y + offsetY ][ x + offsetX ] === 'undefined'
                        || board[ y + offsetY ][ x + offsetX ]
                        || x + offsetX < 0
                        || y + offsetY >= rows
                        || x + offsetX >= cols ) {
                        if (offsetY == 1 && currentShape.freezed) {
                            gameOver = true; // lose if the current shape is settled at the top most row
                            // document.getElementById('playbutton').disabled = false;
                        }
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function clearBoard() {
        for ( let y = 0; y < rows; ++y ) {
            board[ y ] = [];
            for ( let x = 0; x < cols; ++x ) {
                board[ y ][ x ] = 0;
            }
        }
    }

    function clearLines() {
        for ( let y = rows - 1; y >= 0; --y ) {
            let rowFilled = true;
            for ( let x = 0; x < cols; ++x ) {
                if ( board[ y ][ x ] == 0 ) {
                    rowFilled = false;
                    break;
                }
            }
            if ( rowFilled ) {
                // document.getElementById( 'clearsound' ).play();

                console.log( players[0].score )
                players[0].score++;

                for ( let yy = y; yy > 0; --yy ) {
                    for ( let x = 0; x < cols; ++x ) {
                        board[ yy ][ x ] = board[ yy - 1 ][ x ];
                    }
                }
                ++y;
            }
        }
    }


    function newShape() {
        const id = Math.floor( Math.random() * shapes.length );
        const shape = shapes[ id ]; // maintain id for color filling

        currentShape.data = [];

        for ( let y = 0; y < 4; ++y ) {
            currentShape.data[ y ] = [];
            for ( let x = 0; x < 4; ++x ) {
                let i = 4 * y + x;
                if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
                    currentShape.data[ y ][ x ] = id + 1;
                }
                else {
                    currentShape.data[ y ][ x ] = 0;
                }
            }
        }

        // new shape starts to move
        currentShape.freezed = false;
        // position where the shape will evolve
        currentShape.position.x = 5;
        currentShape.position.y = 0;
    }

    function freeze() {
        for ( let y = 0; y < 4; ++y ) {
            for ( let x = 0; x < 4; ++x ) {
                if ( currentShape.data[ y ][ x ] ) {
                    board[ y + currentShape.position.y ][ x + currentShape.position.x ] = currentShape.data[ y ][ x ];
                }
            }
        }
        currentShape.freezed = true;
    }

    function tick() {
        if ( valid( 0, 1 ) ) {
            ++currentShape.position.y;
        }
        // if the element settled
        else {
            freeze();
            valid(0, 1);
            clearLines();
            if ( gameOver ) {
                clearStepInterval();
                return false;
            }
            newShape();
        }
    }

    function clearStepInterval() {
        if( interval )
            clearInterval( interval );
    }

    function isPaused() {
        return paused;
    }
    function isGameOver() {
        return gameOver;
    }
    function pause( command ) {
        if ( gameOver ) return;
        if( command.keyPressed === 'Escape') {
            if( paused ) {
                return resume();
            }
            paused = true;
            clearStepInterval();
        }
    }

    function resume() {
        paused = false;
        interval = setInterval( tick, 400 );
    }



    function moveShape( command ) {
        const acceptedMoves = {
            ArrowUp(shape) {
                console.log('Rotate ', shape);
                const rotated = rotateShape( shape );
                if ( valid(0, 0, rotated) ) {
                    currentShape.data = rotated;
                }
            },
            ArrowDown(shape) {
                console.log('Accelerate shape ', shape);
                if ( valid( 0, 1 ) ) {
                    ++currentShape.position.y;
                }
            },
            ArrowLeft(shape) {
                console.log('Move shape ', shape, ' left');
                if ( valid( -1 ) ) {
                    --currentShape.position.x;
                }
            },
            ArrowRight(shape) {
                console.log('Move shape ', shape, ' rignt');
                if ( valid( 1 ) ) {
                    ++currentShape.position.x;
                }
            }
        };
        const keyPressed = command.keyPressed;
        // const playerId = command.playerId;
        // const currentShape = command.currentShape;
        const shape = currentShape.data;
        const moveAction = acceptedMoves[keyPressed];

        if ( !isPaused() && moveAction ) {
            moveAction( shape );
            // check
        }
    }

    function newGame(command=null) {
        if ( command && command.keyPressed !== 'F2') {
            return;
        }
        gameOver = false;
        clearStepInterval();
        clearBoard();
        newShape();
        resume();

    }

    return {
        cols,
        rows,
        width,
        height,
        block_width,
        block_height,
        players,
        currentShape,
        board,
        moveShape,
        newGame,
        isGameOver,
        isPaused,
        pause
    };
}

function rotateShape( current ) {
    const newCurrent = [];
    for ( let y = 0; y < 4; ++y ) {
        newCurrent[ y ] = [];
        for ( let x = 0; x < 4; ++x ) {
            newCurrent[ y ][ x ] = current[ 3 - x ][ y ];
        }
    }

    return newCurrent;
}

