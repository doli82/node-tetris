import { createGame } from './tetris.js';
import createKeyboardListener from './keyboard-listener.js';
import createMouseListener from './mouse-listener.js';
import createRenderer from './render-screen.js';
import createNetworkListener from './network-listener.js';

import config from './config.js';

const gameWidth = 300;
const gameHeight = 600;

const canvas = document.getElementById('canvas');
canvas.width = gameWidth;
canvas.height = gameHeight;

const game = createGame(gameWidth, gameHeight);
const network = createNetworkListener( `ws://${config.server_ip}:${config.server_port}/` );
const keyboardListener = createKeyboardListener();
const mouseListener = createMouseListener();
const renderer = createRenderer( canvas, game, document );

game.challengeRequested.subscribe( network.sendRequestChallenge );
game.challengeResponded.subscribe( network.sendResponseChallenge );
game.scoreChanged.subscribe( network.sendCurrentScore );
game.challengeEnded.subscribe( network.sendGameOver );
// network.subscribe( game.pause );

keyboardListener.subscribe( game.moveShape );
// keyboardListener.subscribe( network.challenge.moveShape );
keyboardListener.subscribe( game.pause );
keyboardListener.subscribe( game.newGame );

mouseListener.subscribe( renderer.buttonClick );

network.playersListUpdate.subscribe( renderer.updatePlayersList );
network.playerRegistered.subscribe( (player) => game.setCurrentPlayer( player.uid, player.name ) );
network.playerRegistered.subscribe( (player) => renderer.removePlayerFromList( player.name ) );

network.challengeRequested.subscribe( renderer.displayChallengeAlerts );
network.challengeResponded.subscribe( renderer.displayChallengeAlerts );
network.challengeDataReceived.subscribe( game.updateChallengeData );

renderer.renderGame();

if ( !sessionStorage.getItem('currentPlayer') ) {
    const name = prompt('Qual o seu nome?');
    network.registerPlayer( name );
}
