const GameServer = require('./game-server');

<<<<<<< HEAD
const gameserver = new GameServer(process.event.port || 3300);
=======
const gameserver = new GameServer(process.event.PORT || 3300);
>>>>>>> Configura server para hospedagem no heroku
gameserver.run();