
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

window.addEventListener('resize', () =>{
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
});


const game = {
    cols: 10,
    rows: 20,
    players: {
        'player1': { score: 0 },
        'player2': { score: 0 },
    },
    currentShape: [],
    currentX: undefined,
    currentY: undefined,
    board: []
};

const shapes = [
    [ 1, 1, 1, 1 ],
    [ 1, 1, 1, 0, 1 ],
    [ 1, 1, 1, 0, 0, 0, 1 ],
];
const colors = [
    'cyan', 'orange', 'blue', 'yellow', 'red', 'green', 'purple'
];

const level = {
    width: 300,
    height: 600,
    block_width: this.width / game.cols,
    block_height: this.height / game.rows,
    newGame: () => {
        canvas.width = level.width;
        canvas.height = level.height;
        for ( let y = 0; y < game.rows; ++y ) {
            game.board[ y ] = [];
            for ( let x = 0; x < game.cols; ++x ) {
                game.board[ y ][ x ] = 0;
            }
        }
    },
    drawBlock: ( x, y ) => {
        context.fillRect( 
            level.block_width * x, 
            level.block_height * y, 
            level.block_width - 1 , 
            level.block_height - 1 
        );
        context.strokeRect( 
            level.block_width * x,
            level.block_height * y, 
            level.block_width - 1,
            level.block_height - 1 
        );
    }
};
var start = null;



function newShape() {
    var id = Math.floor( Math.random() * shapes.length );
    var shape = shapes[ id ]; // maintain id for color filling

    current = [];
    for ( var y = 0; y < 4; ++y ) {
        current[ y ] = [];
        for ( var x = 0; x < 4; ++x ) {
            var i = 4 * y + x;
            if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
                current[ y ][ x ] = id + 1;
            }
            else {
                current[ y ][ x ] = 0;
            }
        }
    }
    game.currentShape = current;
    // new shape starts to move
    freezed = false;
    // position where the shape will evolve
    currentX = 5;
    currentY = 0;
}


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
                drawBlock( game.currentX + x, game.currentY + y );
            }
        }
    }

    var progress = timestamp - start;
    // element.style.left = Math.min(progress/10, 200) + "px";
    console.log('teste');
    if (progress < (1000 * 60 )) {
      window.requestAnimationFrame(renderGame);
    }
  }
  
  level.newGame();

  window.requestAnimationFrame(renderGame);