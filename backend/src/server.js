const GameServer = require('./game-server');

const gameserver = new GameServer(process.env.PORT || 3300);
gameserver.run();