export default function renderScreen(canvas, game, document ) {
    if( !canvas || !canvas.getContext ) {
        console.log('Não foi possível renderizar o jogo! O objeto canvas não pode ser acessado.');
        return;
    }
    const context = canvas.getContext('2d', {alpha: false});
    const colors = [ 'cyan', 'orange', 'blue', 'yellow', 'red', 'green', 'purple' ];
    let start = null;
    let challengedBy = null;
    let challenging = null;
    let clickable = [];

    function drawBlock( x, y ) {
        context.fillRect(
            game.block_width * x,
            game.block_height * y,
            game.block_width - 1 ,
            game.block_height - 1
        );
        context.strokeRect(
            game.block_width * x,
            game.block_height * y,
            game.block_width - 1,
            game.block_height - 1
        );
        context.stroke();
    }

    function drawShape( shape ) {
        if ( !shape ) return;
        context.beginPath();
        context.fillStyle = 'red';
        context.strokeStyle = 'black';
        for ( let y = 0; y < 4; ++y ) {
            for ( let x = 0; x < 4; ++x ) {
                if ( shape.data && shape.data[ y ] && shape.data[ y ][ x ] ) {
                    context.fillStyle = colors[ shape.data[ y ][ x ] - 1 ];
                    drawBlock( shape.position.x + x, shape.position.y + y );
                }
            }
        }
        context.closePath();
    }

    function drawPreviousShapes() {
        context.beginPath();
        context.strokeStyle = 'black';
        game.board.map( (row, y) => row.map( (element, x) => {
            if ( element ) {
                context.fillStyle = colors[ element - 1 ];
                drawBlock( x, y );
            }
        }));
        context.closePath();
    }

    function drawScores( players ) {
        if( !players ) return;
        let verticalPosition = 20;
        players.map( player => {
            const text = `${player.name + (player.status==='gameover' ? ' (GameOver)' : '')}: ${player.score}`;
            context.fillStyle = 'white';
            context.font = "bold 16px Georgia";
            context.shadowBlur = 3;
            context.fillText(text, game.width - context.measureText(text).width - 20, verticalPosition);
            verticalPosition += 20;
        });
    }

    function drawGameOverScreen() {
        const width = canvas.width * 2 / 3;
        const height = 90;
        const x = (canvas.width - width) / 2;
        const y = ( canvas.height - height) / 2;

        const text = 'Game Over!';

        drawRoundedBox(context, x, y, width, height, 9);

        context.fillStyle = 'white';
        context.font = 'bold 24px Georgia';
        context.shadowBlur = 6;
        context.fillText(
            text,
            (canvas.width - context.measureText(text).width) / 2,
            (canvas.height + 18 ) / 2,
        );
    }

    function drawPausedScreen() {
        const width = canvas.width * 2 / 3;
        const height = 90;
        const x = (canvas.width - width) / 2;
        const y = ( canvas.height - height) / 2;

        const text = 'Pausa';

        drawRoundedBox(context, x, y, width, height, 9);

        context.fillStyle = 'white';
        context.font = 'bold 24px Georgia';
        context.shadowBlur = 6;
        context.fillText(
            text,
            (canvas.width - context.measureText(text).width) / 2,
            (canvas.height + 18 ) / 2,
        );
    }

    function drawResponseChallengeModal(challengerName) {
        const width = canvas.width * 5 / 6;
        const height = 140;
        const x = (canvas.width - width) / 2;
        const y = ( canvas.height - height) / 2;

        const textLine1 = 'Novo Desafio!';
        const textLine2 = `Jogador: ${challengerName}`;

        drawRoundedBox(context, x, y, width, height, 5);
        drawText(context,
            (canvas.width - context.measureText(textLine1).width) / 2,
            (canvas.height - 50 ) / 2,
            textLine1, 18, 'white'
        );
        drawText(context,
            (canvas.width - context.measureText(textLine2).width) / 2,
            canvas.height / 2,
            textLine2, 16, 'white'
        );
        clickable.push( drawButton(context, x + 10, y + 85, 'Aceitar', ( event ) => {
            game.respondChallenge(challengerName, true );
            challengedBy = null;
        }) );

        clickable.push( drawButton(context, x + width - 90, y + 85, 'Recusar', (event) => {
            game.respondChallenge(challengerName, false );
            challengedBy = null;
        } ));
    }
    function drawRequestChallengeModal(adversaryName) {
        const width = canvas.width * 5 / 6;
        const height = 140;
        const x = (canvas.width - width) / 2;
        const y = ( canvas.height - height) / 2;

        const textLine1 = 'Desafiar Jogador!';
        const textLine2 = `Jogador: ${adversaryName}`;

        drawRoundedBox(context, x, y, width, height, 5);
        drawText(context,
            (canvas.width - context.measureText(textLine1).width) / 2,
            (canvas.height - 50 ) / 2,
            textLine1, 18, 'white'
        );
        drawText(context,
            (canvas.width - context.measureText(textLine2).width) / 2,
            canvas.height / 2,
            textLine2, 16, 'white'
        );
        clickable.push( drawButton(context, x + 10, y + 85, 'Cancelar', ( event ) => {
            // game.respondChallenge(challengerName, true );
            challenging = null;
        }) );

        clickable.push( drawButton(context, x + width - 90, y + 85, 'Desafiar', (event) => {
            game.requestChallenge(adversaryName);
            challenging = null;
        } ));
    }
    
    function renderGame( timestamp = null ) {
        if (!start) start = timestamp;
        clickable = [];

        context.clearRect( 0, 0, game.width, game.height );
        if( !game.isPaused() ) {
            drawPreviousShapes();
            drawShape( game.getCurrentShape() );
            drawScores( game.getPlayers() );

            if( game.isGameOver() && !challengedBy && !challenging ) {
                drawGameOverScreen();
            }
        } else if( !game.isGameOver() ) {
            drawPausedScreen();
        }

        if( challengedBy ) {
            drawResponseChallengeModal( challengedBy );
        } else if( challenging ) {
            drawRequestChallengeModal( challenging );
        }

        const progress = timestamp - start;
        // element.style.left = Math.min(progress/10, 200) + "px";
        // console.log('teste');

        // if (progress < (1000 * 60 )) {
        window.requestAnimationFrame(renderGame);
        // }
    }
    function buttonClick( command ) {
        clickable.map( element => {
            if ( typeof element.onClick === 'function' && 
                element.position.x <= command.pageX && element.position.y <= command.pageY &&
                (element.position.x + element.size.width) >= command.pageX &&
                (element.position.y + element.size.height) >= command.pageY
            ) {
                element.onClick( command );
            }
        });
    }
    function updatePlayersList( players ) {
        const playersNode = document.getElementById("players");
        playersNode.innerHTML = '';
        const me = game.getCurrentPlayer();
        players.forEach( player => {
            if ( me && player.name === me.name ) {
                return;
            }
            const a = document.createElement("a");
            const li = document.createElement("li");
            a.href = `javascript:challenge("${player.name}")`;
            a.innerText = player.name;
            a.title = 'Desafiar este jogador';
            li.appendChild(a);
            playersNode.appendChild( li );
        } );
    }
    function removePlayerFromList( name ) {
        const playersItems = document.getElementById("players").childNodes;
        playersItems.forEach( (item, index ) => {
            if ( item.childNodes.item(0).innerText === name ) {
                item.remove();
            }
        });
    }

    function displayChallengeAlerts( packet ) {
        if ( packet.type === 'ChallengeRequested' ) {
            challengedBy = packet.challenger;
        } else if( packet.type === 'ChallengeResponded' ) {
            const me = game.getCurrentPlayer();
            if( packet.refused && packet.challenger !== me.name ) {
                alert('O jogador ' + packet.challenger + ' recusou a disputa.');
            }
        }
    }

    window.challenge = (playerName) => {
        challenging = playerName;
        // if ( confirm('Desafiar '+ playerName + '?') ) {
        //     game.requestChallenge(playerName);
        // }
    };

    return {
        renderGame,
        updatePlayersList,
        removePlayerFromList,
        displayChallengeAlerts,
        buttonClick
    };
}

function drawRoundedBox(context, x, y, width, height, radius, fillColor, strokeColor) {
    if ( width < 2 * radius )  radius = width / 2;
    if ( height < 2 * radius )  radius = height / 2;
    context.beginPath();
    context.fillStyle = fillColor ? fillColor : 'rgba(106, 115, 124, 0.7)';
    context.strokeStyle = strokeColor ? strokeColor : 'rgb(106, 115, 124)';
    context.moveTo( x + radius, y );
    context.arcTo( x + width, y,   x + width, y + height, radius );
    context.arcTo( x + width, y + height, x, y + height, radius );
    context.arcTo( x, y + height, x, y, radius );
    context.arcTo( x, y, x + width, y, radius );
    context.fill();
    context.stroke();
    context.closePath();
}
function drawButton(context, x, y, label, action=null ) {
    context.beginPath();
    const width = context.measureText(label).width + 16;
    const height = 40;
    const fontSize = 14;
    drawRoundedBox(context, x, y, width, height, 8);
    drawText(context, x + 8, y + (height + fontSize) / 2, label, fontSize, 'white');
    context.closePath();
    return { position: {x, y}, size: {width, height}, onClick: action };
}
function drawText(context, x, y, text, size, color) {
    context.fillStyle = color;
    context.font = `bold ${size}px Georgia`;
    context.shadowBlur = 6;
    context.fillText( text, x, y );
}
