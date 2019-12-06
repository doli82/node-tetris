
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
/*
window.addEventListener('resize', () =>{
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
});
*/

const game = {
    gameOver: true,
    cols: 10,
    rows: 20,
    players: {
        'player1': { score: 0 },
        'player2': { score: 0 },
    },
    currentShape: [],
    currentX: undefined,
    currentY: undefined,
    currentFreezed: undefined,
    board: []
};

const shapes = [
    [ 1, 1, 1, 1 ],
    [ 1, 1, 1, 0, 1 ],
    [ 1, 1, 1, 0, 0, 0, 1 ],
    [ 1, 1, 0, 0, 1, 1 ],
    [ 1, 1, 0, 0, 0, 1, 1 ],
    [ 0, 1, 1, 0, 1, 1 ],
    [ 0, 1, 0, 0, 1, 1, 1 ]
];
const colors = [
    'cyan', 'orange', 'blue', 'yellow', 'red', 'green', 'purple'
];

const level = {
    width: 300,
    height: 600,
    block_width: () => level.width / game.cols,
    block_height: () => level.height / game.rows,
    interval: undefined,
    drawBlock: ( x, y ) => {
        context.fillRect( 
            level.block_width() * x, 
            level.block_height() * y, 
            level.block_width() - 1 , 
            level.block_height() - 1 
        );
        context.strokeRect( 
            level.block_width() * x,
            level.block_height() * y, 
            level.block_width() - 1,
            level.block_height() - 1 
        );
        context.stroke();
    },
    clearTheBoard: () => {
        for ( let y = 0; y < game.rows; ++y ) {
            game.board[ y ] = [];
            for ( let x = 0; x < game.cols; ++x ) {
                game.board[ y ][ x ] = 0;
            }
        }
    },
    clearLines: () => {
        for ( let y = game.rows - 1; y >= 0; --y ) {
            let rowFilled = true;
            for ( let x = 0; x < game.cols; ++x ) {
                if ( game.board[ y ][ x ] == 0 ) {
                    rowFilled = false;
                    break;
                }
            }
            if ( rowFilled ) {
                // document.getElementById( 'clearsound' ).play();
                for ( var yy = y; yy > 0; --yy ) {
                    for ( var x = 0; x < game.cols; ++x ) {
                        game.board[ yy ][ x ] = game.board[ yy - 1 ][ x ];
                    }
                }
                ++y;
            }
        }
    },
    valid: ( offsetX, offsetY, newCurrent ) => {
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        offsetX = game.currentX + offsetX;
        offsetY = game.currentY + offsetY;
        newCurrent = newCurrent || game.currentShape;
    
        for ( let y = 0; y < 4; ++y ) {
            for ( let x = 0; x < 4; ++x ) {
                if ( newCurrent[ y ][ x ] ) {
                    if ( typeof game.board[ y + offsetY ] == 'undefined'
                      || typeof game.board[ y + offsetY ][ x + offsetX ] == 'undefined'
                      || game.board[ y + offsetY ][ x + offsetX ]
                      || x + offsetX < 0
                      || y + offsetY >= game.rows
                      || x + offsetX >= game.cols ) {
                        if (offsetY == 1 && game.currentFreezed) {
                            game.gameOver = true; // lose if the current shape is settled at the top most row
                            // document.getElementById('playbutton').disabled = false;
                        } 
                        return false;
                    }
                }
            }
        }
        return true;
    },
    newShape: () => {
        const id = Math.floor( Math.random() * shapes.length );
        const shape = shapes[ id ]; // maintain id for color filling
    
        game.currentShape = [];
        for ( let y = 0; y < 4; ++y ) {
            game.currentShape[ y ] = [];
            for ( let x = 0; x < 4; ++x ) {
                let i = 4 * y + x;
                if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
                    game.currentShape[ y ][ x ] = id + 1;
                }
                else {
                    game.currentShape[ y ][ x ] = 0;
                }
            }
        }
        
        // new shape starts to move
        game.currentFreezed = false;
        // position where the shape will evolve
        game.currentX = 5;
        game.currentY = 0;
    },
    tick: () => {
        if ( level.valid( 0, 1 ) ) {
            ++game.currentY;
        }
        // if the element settled
        else {
            level.freeze();
            level.valid(0, 1);
            level.clearLines();
            if ( game.gameOver ) {
                // this.clearAllIntervals();
                return false;
            }
            level.newShape();
        }
    },
    freeze: () => {
        for ( let y = 0; y < 4; ++y ) {
            for ( let x = 0; x < 4; ++x ) {
                if ( game.currentShape[ y ][ x ] ) {
                    game.board[ y + game.currentY ][ x + game.currentX ] = game.currentShape[ y ][ x ];
                }
            }
        }
        game.currentFreezed = true;
    },
    newGame: () => {
        canvas.width = level.width;
        canvas.height = level.height;
        level.clearTheBoard();
        level.newShape();
        game.gameOver = false;
        level.interval = setInterval( level.tick, 400 );
    }
};
var start = null;

function renderGame(timestamp) {
    if (!start) start = timestamp;
    
    context.clearRect( 0, 0, level.width, level.height );
    
    context.strokeStyle = 'black';

    for ( let x = 0; x < game.cols; ++x ) {
        for ( let y = 0; y < game.rows; ++y ) {
            if ( game.board[ y ][ x ] ) {                
                context.fillStyle = colors[ game.board[ y ][ x ] - 1 ];
                level.drawBlock( x, y );
            }
        }
    }

    context.fillStyle = 'red';
    context.strokeStyle = 'black';
    for ( let y = 0; y < 4; ++y ) {
        for ( let x = 0; x < 4; ++x ) {
            if ( game.currentShape[ y ][ x ] ) {
                context.fillStyle = colors[ game.currentShape[ y ][ x ] - 1 ];
                level.drawBlock( game.currentX + x, game.currentY + y );
            }
        }
    }

    var progress = timestamp - start;
    // element.style.left = Math.min(progress/10, 200) + "px";
    // console.log('teste');
    
    if (progress < (1000 * 60 )) {
      window.requestAnimationFrame(renderGame);
    }
  }
  
  level.newGame();

  window.requestAnimationFrame(renderGame);