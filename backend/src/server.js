const GameServer = require('./game-server');

const gameserver = new GameServer(process.event.PORT || 3300);
gameserver.run();