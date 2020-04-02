export default function createNetworkListener (gameServerUri) {
    const state = {
        playersListUpdate: [],
        playerRegistered: [],
        challengeRequested: [],
        challengeResponded: [],
        challengeDataReceived: []
    };
    const network = {
      challenge: {
          moveShape( command ) {

              const acceptedMoves = {
                  ArrowUp(shape) {
                      sendPacket( { type: 'ChallengeMove', id, uid, move: 'ArrowUp' } );
                  },
                  ArrowDown(shape) {
                      sendPacket( { type: 'ChallengeMove', id, uid, move: 'ArrowDown' } );
                  },
                  ArrowLeft(shape) {
                      if ( valid( -1 ) ) {
                          --shape.position.x;
                      }
                  },
                  ArrowRight(shape) {
                      if ( valid( 1 ) ) {
                          ++shape.position.x;
                      }
                  }
              };
              const keyPressed = command.keyPressed;
              // const playerId = command.playerId;
              // const currentShape = command.currentShape;
              const moveAction = acceptedMoves[keyPressed];

              if ( moveAction && currentShape ) {
                  moveAction( currentShape );
                  // check
              }
          }
      }
    };
    const websocket = new WebSocket(gameServerUri);
    const packetQueue = [];

    websocket.onopen = function () {
        // websocket.send('Ping'); // Send the message 'Ping' to the server
        console.log('Conectado ao servidor!');
        if ( sessionStorage.getItem('currentPlayer') ) {
            reconnectPlayer();
        }

        packetQueue.forEach( packet => sendPacket(packet) );
    };

    // Log errors
    websocket.onerror = function (error) {
        websocket.log('WebSocket Error ' + error);
    };

    // Log messages from the server
    websocket.onmessage = ( message ) => {
        console.log('Server message: ' + message.data);
        let packet;
        try {
            packet = JSON.parse(message.data);
        } catch {}

        if( !packet || !packet.type ) {
            return;
        }
        const actionFunction = allowedActions[ packet.type ];

        if ( actionFunction ) {
            actionFunction( packet );
        }
    };

    const allowedActions = {
        Register( packet ) {
            if ( packet.success ) {
                sessionStorage.setItem('currentPlayer', JSON.stringify( packet ));
                state.playerRegistered.forEach( observerFunction => observerFunction( packet ) );
            }
        },
        PlayersList( packet ) {
            if ( packet.players ) {
                state.playersListUpdate.forEach( observerFunction => observerFunction( packet.players ) );
            }
        },
        ChallengeRequested( packet ) {
            if ( packet.challenger ) {
                state.challengeRequested.forEach( observerFunction => observerFunction( packet ) );
            }
        },
        ChallengeResponded( packet ) {
            if ( packet.accepted && packet.challengeid ) {
                sessionStorage.setItem('currentChallenge', JSON.stringify( packet ));
                sendRequestChallengeData( packet.challengeid );
            }
            if ( packet.challenger ) {
                state.challengeResponded.forEach( observerFunction => observerFunction( packet ) );
            }
        },
        RequestChallengeData( packet ) {
            if( packet.challengedata ) {
                state.challengeDataReceived.forEach( observerFunction => observerFunction( packet ) );
            }
        },
    };

    const playersListUpdate = {
        subscribe( observerFunction ) {
            state.playersListUpdate.push( observerFunction );
        }
    };
    const playerRegistered = {
        subscribe( observerFunction ) {
            state.playerRegistered.push( observerFunction );
        }
    };
    const challengeRequested = {
        subscribe( observerFunction ) {
            state.challengeRequested.push( observerFunction );
        }
    };
    const challengeResponded = {
        subscribe( observerFunction ) {
            state.challengeResponded.push( observerFunction );
        }
    };
    const challengeDataReceived = {
        subscribe( observerFunction ) {
            state.challengeDataReceived.push( observerFunction );
        }
    };

    function sendPacket( packet ) {
        if ( websocket.readyState === 1 ) {
            websocket.send( JSON.stringify( packet ) );
        } else {
            packetQueue.push( packet );
        }
    }
    function subscribe( observerFunction ) {
        state.observers.push( observerFunction );

    }
    function notifyAll( command ) {
        state.observers.forEach( observerFunction => observerFunction( command ) );

    }

    function sendCurrentScore( player ) {
        try {
            const challenge = JSON.parse( sessionStorage.getItem('currentChallenge') );
            sendPacket( { type: 'ChallengeUpdatedScore', player, challengeid: challenge.challengeid } );
        } catch (err) {
            console.log('Erro ao enviar pontuação', err);
        }

    }
    function sendRequestChallenge( uid, adversary ) {
        sendPacket( { type: 'ChallengeRequested', uid, adversary } );
    }
    function sendResponseChallenge( uid, adversary, accepted ) {
        if( accepted ) {
            sendPacket( { type: 'ChallengeResponded', uid, adversary, accepted: true } );
        } else {
            sendPacket( { type: 'ChallengeResponded', uid, adversary, refused: true } );
        }
    }
    function sendRequestChallengeData( challengeid ) {
        sendPacket( { type: 'RequestChallengeData', challengeid } );
    }
    function registerPlayer( name ) {
        sendPacket( { type: 'Register', name } );
    }
    function reconnectPlayer() {
        try {
            const player = JSON.parse( sessionStorage.getItem('currentPlayer') );
            sendPacket( { type: 'Register', uid: player.uid, name: player.name } );
            // websocket.send(JSON.stringify({ type: 'Register', name: player.name }))
        } catch {}
    }
    return {
        registerPlayer,
        sendRequestChallenge,
        sendResponseChallenge,
        sendCurrentScore,
        challengeRequested,
        challengeResponded,
        challengeDataReceived,
        playerRegistered,
        playersListUpdate
    };
}