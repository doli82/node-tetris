import createGame from './tetris.js';
import createKeyboardListener from './keyboard-listener.js';
import createRenderer from './render-screen.js';
import createNetworkListener from './network-listener.js';


/*
window.addEventListener('resize', () =>{
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
});
*/

const gameWidth = 300;
const gameHeight = 600;

const canvas = document.getElementById('canvas');
canvas.width = gameWidth;
canvas.height = gameHeight;

const game = createGame(gameWidth, gameHeight);

const keyboardListener = createKeyboardListener();
keyboardListener.subscribe( game.moveShape );
keyboardListener.subscribe( game.pause );
keyboardListener.subscribe( game.newGame );

const networkListener = createNetworkListener();
// networkListener.subscribe( game.pause );

const renderer = createRenderer( canvas, game );
renderer.renderGame();

// prompt('Qual o seu nome?')
  
  // game.newGame();

  // window.requestAnimationFrame(renderGame);