const createGame = (width=300, height=600, isChalange=false, nextShapes = [] ) => {
    const cols = 10;
    const rows = 20;
    const block_width = width / cols;
    const block_height = height / rows;

    let interval;
    let paused = false;
    let gameOver = false;
    let isChallenge = false;

    let players = [];
    const board = createBoard(rows, cols);

    let currentShape;

    const state = {
        challengeRequested: [],
        challengeResponded: [],
        scoreChanged: [],
    };

    const challengeRequested = {
        subscribe( observerFunction ) {
            state.challengeRequested.push( observerFunction );
        }
    };
    function requestChallenge( playerName ) {
        const current = getCurrentPlayer();
        state.challengeRequested.forEach( observerFunction => observerFunction( current.uid, playerName ) );
    }    
    const challengeResponded = {
        subscribe( observerFunction ) {
            state.challengeResponded.push( observerFunction );
        }
    };
    const scoreChanged = {
        subscribe( observerFunction ) {
            state.scoreChanged.push( observerFunction );
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
                    if ( 
                        typeof board[ y + offsetY ] === 'undefined' || 
                        typeof board[ y + offsetY ][ x + offsetX ] === 'undefined' ||
                        board[ y + offsetY ][ x + offsetX ] || 
                        x + offsetX < 0 ||
                        y + offsetY >= rows ||
                        x + offsetX >= cols 
                    ) {
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

    function clearLines() {
        for ( let y = rows - 1; y >= 0; --y ) {
            let rowFilled = true;
            for ( let x = 0; x < cols; ++x ) {
                if ( board[ y ][ x ] === 0 ) {
                    rowFilled = false;
                    break;
                }
            }
            if ( rowFilled ) {
                increaseCurrentPlayerScore();
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
        if ( nextShapes.length < 3 ) {
            for( let i = 0; i < 10; i++ ) {
                nextShapes.unshift( generateRandomShape() );
            }
        }
        currentShape = nextShapes.pop();
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

    function setCurrentPlayer( uid, name ) {
        const current = getCurrentPlayer();
        if ( current ) {
            const player = players[ players.indexOf(current) ];
            player.name = name;
            player.uid = uid;
        } else {
            players.push( {name, score: 0, uid} );
        }
    }
    function increaseCurrentPlayerScore() {
        const current = getCurrentPlayer();
        
        if ( current ) {
            players[ players.indexOf(current) ].score++;
            if( isChallenge ) {
                state.scoreChanged.forEach( observerFunction => observerFunction( current ) );
            }
        }
    }
    function addPlayer( name ){
        players.push( {name, score: 0 } );
    }
    function removePlayer( name ) {
        players = players.filter( element => element.name != name );
    }
    function getCurrentShape() {
        return currentShape;
    }
    function getPlayers() {
        return players;
    }
    function getCurrentPlayer() {
        return players.find(element => element.uid );
    }
    function updatePlayerScore( name, score = 0 ) {
        return players.find(element => element.name === name ).score = score;
    }
    function respondChallenge( playerName, accepted ) {
        const current = getCurrentPlayer();
        state.challengeResponded.forEach( observerFunction => observerFunction( current.uid, playerName, accepted ) );
    }

    function createChallenge( packet ){
        if( packet.accepted && packet.challenger ) {
            addPlayer( packet.challenger );
            newGame();
        }
    }
    function updateChallengeData(packet ){
        if( packet.challengedata ) {
            const challenger = packet.challengedata.challenger;
            const adversary = packet.challengedata.adversary;
            const servershapes = packet.challengedata.shapes;

            const currentPlayers = getPlayers();

            if ( getCurrentPlayer().name === challenger.name ) {
                addPlayer( adversary.name );
                updatePlayerScore( adversary.name, adversary.score );
            } else {
                addPlayer( challenger.name );
                updatePlayerScore( challenger.name, challenger.score );
            }
            if( !interval ) {
                isChallenge = true;
                nextShapes = servershapes;
                newGame();
            }
        }
    }

    function moveShape( command ) {
        const acceptedMoves = {
            ArrowUp(shape) {
                const rotatedShape = rotateShape( shape );
                if ( valid(0, 0, rotatedShape.data) ) {
                    shape.data = rotatedShape.data;
                }
            },
            ArrowDown(shape) {
                if ( valid( 0, 1 ) ) {
                    ++shape.position.y;
                }
            },
            ArrowLeft(shape) {
                if ( valid( -1 ) ) {
                    --shape.position.x;
                }
            },
            ArrowRight(shape) {
                if ( valid( 1 ) ) {
                    ++shape.position.x;
                }
            }
        };
        const keyPressed = command.keyPressed;
        // const playerId = command.playerId;
        // const currentShape = command.currentShape;
        const moveAction = acceptedMoves[keyPressed];

        if ( !isPaused() && moveAction && currentShape ) {
            moveAction( currentShape );
            // check
        }
    }

    function newChallenge() {
        gameOver = false;
        isChallenge = true;
    }

    function newGame(command=null) {
        if ( command && command.keyPressed !== 'F2') {
            return;
        }
        gameOver = false;
        clearStepInterval();
        clearBoard( board );
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
        currentShape,
        board,
        challengeRequested,
        challengeResponded,
        scoreChanged,
        getPlayers,
        getCurrentPlayer,
        getCurrentShape,
        setCurrentPlayer,
        moveShape,
        newGame,
        isGameOver,
        isPaused,
        pause,
        requestChallenge,
        respondChallenge,
        createChallenge,
        updateChallengeData
    };
};

const shapesData = [
    [ 1, 1, 1, 1 ],
    [ 1, 1, 1, 0, 1 ],
    [ 1, 1, 1, 0, 0, 0, 1 ],
    [ 1, 1, 0, 0, 1, 1 ],
    [ 1, 1, 0, 0, 0, 1, 1 ],
    [ 0, 1, 1, 0, 1, 1 ],
    [ 0, 1, 0, 0, 1, 1, 1 ]
];
const generateRandomShape = ( ) => {
    const position = Math.floor( Math.random() * shapesData.length );
    const shapeModel = shapesData[ position ];
    const shape = { data: [], freezed: false, position: { x: 4, y: 0 } };
    for( let positionX = 0; positionX < 4; positionX++ ) {
        shape.data[ positionX ] = [];
        for ( let positionY = 0; positionY < 4; positionY++ ) {
            let index = 4 * positionX + positionY;
            if ( typeof shapeModel[ index ] !== 'undefined' && shapeModel[ index ] ) {
                shape.data[ positionX ][ positionY ] = position + 1;
            } else {
                shape.data[ positionX ][ positionY ] = 0;
            }
        }
    }
    return shape;
};

const rotateShape = ( currentShape ) => {
    const shape = { 
        data: [],
        freezed: currentShape.freezed,
        position: currentShape.position
    };
    for ( let row = 0; row < 4; row++ ) {
        shape.data[ row ] = [];
        for ( let column = 0; column < 4; column++ ) {
            shape.data[ row ][ column ] = currentShape.data[ 3 - column ][ row ];
        }
    }
    return shape;
};


const createBoard = (rowsNumber, colsNumber) => {
    const board = [];
    for ( let row = 0; row < rowsNumber; row++ ) {
        board[ row ] = Array.from( new Array( colsNumber ) ).map( () => 0 );
    }
    return board;
};

const clearBoard = ( board ) => {
    board.forEach( (row, index) => 
        board[index] = Array.from( new Array( row.length ) ).map( () => 0 ) 
    );
};

module.exports = {
    generateRandomShape,
    rotateShape,
    createBoard,
    clearBoard,
    createGame,
};
