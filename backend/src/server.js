const GameServer = require('./game-server');

const gameserver = new GameServer(process.event.port || 3300);
gameserver.run();