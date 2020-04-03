const WebSocketServer = require('websocket').server;
const http = require('http');
const { generateRandomShape } = require('./tetris');

module.exports = class GameServer {
    constructor(port) {
      this.server = http.createServer((request, response) => {
          response.header('Access-Control-Allow-Origin', '*');
          next();
      });
      this.port = port;
      this.states = {};
      this.players = [];
      this.allowedActions = this.getAllowedActions();
      this.connections = [];
      this.challenges = [];
    }
    run() {
      this.server.listen( this.port, () => {
          console.log((new Date()) + ' - Servidor WebSocket escutando na porta: ' + this.port);
      } );

      const wsserver = new WebSocketServer({ httpServer: this.server });

      wsserver.on('request', request => {
          const connection = request.accept(null, request.origin);
          connection.id = this.getUniqueID();
          console.log(new Date(), ' Nova conexão da origem ', request.origin);
          connection.on('message', message => this.incomingMessage(message.utf8Data, connection) );
          connection.on('close', (reasonCode, description) => this.connectionClosed(connection) );
          this.connections = wsserver.connections;
      });
    }
    getUniqueID() {
        const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        return s4() + s4() + '-' + s4();
    }
  subscribe() {

  }
  notifyAllPlayers( packet ) {
      // this.connections.forEach( connection => {
      //     this.allowedActions.PlayersList( { type: 'PlayersList' }, connection);
      // });
  }
  registerPlayer( uid, name ) {
      if ( !this.players.find(element => element.name === name) ) {
          let currentPlayerData = this.players.find(element => element.uid === uid);
          if ( currentPlayerData ) {
              this.players[ this.players.indexOf(currentPlayerData) ].name = name;
          } else {
              this.players.push({ uid, name });
          }
          this.connections.forEach( connection => {
              this.allowedActions.PlayersList( { type: 'PlayersList' }, connection);
          });
          return true;
      }
      return false;
  }
  generateChallenge( challenger, adversary ) {
        const challenge = {
            id: this.getUniqueID(),
            shapes: [],
            challenger: {
                name: challenger.name,
                score: 0,
                status: 'playing'
            },
            adversary: {
                name: adversary.name,
                score: 0,
                status: 'playing'
            }
        };

        for ( let size = 0; size < 100 ; size++ ) {
            challenge.shapes.unshift( generateRandomShape() );
            challenge.shapes.sort(() => 0.5 - Math.random());
        }
        this.challenges.push( challenge );
        return challenge.id;
  }
  unregisterPlayer( uid ) {
    this.players = this.players.filter(element => element.uid !== uid);
    this.connections.forEach( connection => {
      this.allowedActions.PlayersList( { type: 'PlayersList' }, connection);
    });
  }
  getRegisteredPlayers() {
      return this.players;
  }
  getPlayerByName( name ) {
      return this.players.find(element => element.name === name);
  }
  getPlayerByUid( uid ) {
      return this.players.find(element => element.uid === uid);
  }

  getAllowedActions() {
      const gameserver = this;
      return {
          Register( packet, connection ) {
              console.log('Pacote de Registro:', packet);
              if ( gameserver.registerPlayer(connection.id, packet.name ) ) {
                  connection.send( JSON.stringify( Object.assign(packet, {uid: connection.id, success: true }) ) );
              } else {
                  connection.send( JSON.stringify( Object.assign(packet, {uid: connection.id, success: false }) ) );
              }
          },
          PlayersList( packet, connection ) {
              console.log('Lista de jogadores enviada para:', connection.id);
              connection.send( JSON.stringify( Object.assign( packet, { players: gameserver.getRegisteredPlayers() })));
          },
          ChallengeRequested(packet, connection) {
              const challenger = gameserver.getPlayerByUid( packet.uid );
              const adversary = gameserver.getPlayerByName( packet.adversary );
              if( !adversary ) {
                  connection.send( JSON.stringify( Object.assign( packet, { error: 'no adversary' })));
              } else {
                  const adversaryConnection = gameserver.connections.find( element => element.id === adversary.uid );
                  let challengePacket =  Object.assign( packet, { challenger: challenger.name } );
                  delete challengePacket.uid;
                  delete challengePacket.adversary;
                  adversaryConnection.send( JSON.stringify(challengePacket ) );
              }
              console.log('challenge', packet);
          },
          ChallengeResponded(packet, connection) {
              const challenger = gameserver.getPlayerByUid( packet.uid );
              const adversary = gameserver.getPlayerByName( packet.adversary );
              if( !adversary ) {
                  connection.send( JSON.stringify( Object.assign( packet, { error: 'no adversary' })));
              } else {
                  const adversaryConnection = gameserver.connections.find( element => element.id === adversary.uid );
                  let challengePacket;
                  if( packet.accepted ) { // Criar dispita
                      const challengeid = gameserver.generateChallenge( challenger, adversary);
                      challengePacket = Object.assign( packet, { challenger: challenger.name, accepted: true, challengeid } );
                      console.log( 'Uma disputa com id %s foi criada', challengeid );
                  } else {
                      challengePacket = Object.assign( packet, { challenger: challenger.name, refused: true } );
                      console.log( 'Uma disputa foi recusada pelo jogador %s.', adversary.name );
                  }
                  delete challengePacket.uid;
                  delete challengePacket.adversary;
                  connection.send( JSON.stringify(challengePacket ) );
                  adversaryConnection.send( JSON.stringify(challengePacket ) );
              }
          },
          RequestChallengeData(packet, connection) {
              if( packet.challengeid ) {
                  const challenge = gameserver.challenges.find( element => element.id === packet.challengeid );
                  if ( challenge ) {
                      const challengePacket = Object.assign( packet, { challengedata: challenge } );
                      connection.send( JSON.stringify(challengePacket ) );
                  }
              }
          },
          ChallengeUpdatedScore(packet, connection) {
              if( packet.player && gameserver.players.find(element => element.uid === packet.player.uid ) ) {
                  const challenge = gameserver.challenges.find(element => element.id === packet.challengeid );
                  if( packet.challengeid && challenge ) {
                      if ( challenge.adversary.name ===  packet.player.name ) {
                          challenge.adversary.score = packet.player.score;
                      } else if( challenge.challenger.name ===  packet.player.name  ) {
                          challenge.challenger.score = packet.player.score;
                      }
                      const challenger = gameserver.getPlayerByName( challenge.challenger.name );
                      const adversary = gameserver.getPlayerByName( challenge.adversary.name );

                      const responsePacket = { type: 'RequestChallengeData', challengeid: challenge.id };

                      const con = gameserver.connections.filter(
                          element => element.id === challenger.uid || element.id === adversary.uid
                      );
                      con.forEach(
                          element => gameserver.allowedActions.RequestChallengeData( responsePacket, element )
                      );
                      console.log('Pontuação do jogador %s atualizada na disputa %s', packet.player.name, challenge.id);
                  }
              }
          },
          ChallengeEnded(packet, connection) {
            if( packet.player && gameserver.players.find(element => element.uid === packet.player.uid ) ) {
                const challenge = gameserver.challenges.find(element => element.id === packet.challengeid );
                if( packet.challengeid && challenge && packet.reason ) {
                    if ( challenge.adversary.name === packet.player.name ) {
                        if ( challenge.challenger.status === 'gameover' && challenge.challenger.score < challenge.adversary.score ) {
                            challenge.adversary.status = 'winner';
                        } else {
                            challenge.adversary.status = packet.reason;
                        }
                    } else if( challenge.challenger.name ===  packet.player.name  ) {
                        if ( challenge.adversary.status === 'gameover' && challenge.adversary.score < challenge.challenger.score) {
                            challenge.challenger.status = 'winner';
                        } else {
                            challenge.challenger.status =  packet.reason;
                        }
                    }

                    if (
                        challenge.challenger.status === challenge.adversary.status && 
                        challenge.adversary.status === 'gameover' && 
                        challenge.challenger.score !== challenge.adversary.score 
                    ) {
                        if( challenge.challenger.score > challenge.adversary.score ) {
                            challenge.challenger.status = 'winner';
                        } else {
                            challenge.adversary.status = 'winner';
                        }
                    }

                    const challenger = gameserver.getPlayerByName( challenge.challenger.name );
                    const adversary = gameserver.getPlayerByName( challenge.adversary.name );

                    const responsePacket = { type: 'RequestChallengeData', challengeid: challenge.id };

                    const con = gameserver.connections.filter(
                        element => element.id === challenger.uid || element.id === adversary.uid
                    );
                    con.forEach(
                        element => gameserver.allowedActions.RequestChallengeData( responsePacket, element )
                    );
                    console.log('O jogador %s esta fora da disputa %s', packet.player.name, challenge.id);
                }
            }
          }
      };
  };

  incomingMessage(message, connection ) {
      let packet;
      try {
          packet = JSON.parse(message);
      } catch(err) {}

      if( !packet || !packet.type ) {
          return;
      }
      const actionFunction = this.allowedActions[ packet.type ];

      if ( actionFunction ) {
          actionFunction( packet, connection );
      }
  }
  connectionClosed(connection) {
    this.unregisterPlayer( connection.id );
  }
};
