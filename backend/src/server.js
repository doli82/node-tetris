const GameServer = require('./game-server');

const gameserver = new GameServer(3300);
gameserver.run();