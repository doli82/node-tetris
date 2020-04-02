export default function renderScreen(canvas, game, document ) {
    if( !canvas || !canvas.getContext ) {
        console.log('Não foi possível renderizar o jogo! O objeto canvas não pode ser acessado.');
        return;
    }
    const context = canvas.getContext('2d', {alpha: false});
    const colors = [ 'cyan', 'orange', 'blue', 'yellow', 'red', 'green', 'purple' ];
    let start = null;

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
        for ( let x = 0; x < game.cols; ++x ) {
            for ( let y = 0; y < game.rows; ++y ) {
                if ( game.board && game.board[ y ] && game.board[ y ][ x ] ) {
                    context.fillStyle = colors[ game.board[ y ][ x ] - 1 ];
                    drawBlock( x, y );
                }
            }
        }
        context.closePath();
    }

    function drawScores( players ) {
        if( !players ) return;
        let verticalPosition = 20;
        players.forEach( player => {
            const text = player.name + ': ' + player.score;
            context.fillStyle = 'white';
            context.font = "bold 16px Georgia";
            context.shadowBlur = 3;
            context.fillText(text, game.width - context.measureText(text).width - 20, verticalPosition);
            verticalPosition += 20;

        });
    }

    function drawGameOver() {
        const width = canvas.width * 2 / 3;
        const height = 90;
        const x = (canvas.width - width) / 2;
        const y = ( canvas.height - height) / 2;

        const text = 'Game Over!';

        drawRoundedBox(x, y, width, height, 9);

        context.fillStyle = 'white';
        context.font = 'bold 24px Georgia';
        context.shadowBlur = 6;
        context.fillText(
            text,
            (canvas.width - context.measureText(text).width) / 2,
            (canvas.height + 18 ) / 2,
        );
    }

    function drawRoundedBox(x, y, width, height, radius, fillColor, strokeColor) {
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

    function renderGame( timestamp = null ) {
        if (!start) start = timestamp;

        context.clearRect( 0, 0, game.width, game.height );
        if( !game.isPaused() ) {
            drawPreviousShapes();
            drawShape( game.getCurrentShape() );
            drawScores( game.getPlayers() );

            if( game.isGameOver() ) {
                drawGameOver();
            }
        } else {
           console.log('criar tela de pause');
        }
        const progress = timestamp - start;
        // element.style.left = Math.min(progress/10, 200) + "px";
        // console.log('teste');

        // if (progress < (1000 * 60 )) {
        window.requestAnimationFrame(renderGame);
        // }
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
            a.href = 'javascript:challenge("' + player.name + '")';
            a.innerText = player.name;
            a.title = 'Desafiar este jogador';
            li.appendChild(a)
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
        if( packet.refused ) {
            alert('O jogador ' + packet.challenger + ' recusou a disputa.');
        } else if ( !packet.accepted && packet.challenger ) {
            if ( confirm('O jogador ' + packet.challenger + ' desafiou você! Deseja aceitar? ') ) {
                console.log('aceitar');
                game.respondChallenge(packet.challenger, true );
            } else {
                console.log('recusar');
                game.respondChallenge(packet.challenger, false );
            }
        }
    }

    window.challenge = (playerName) => {
        if ( confirm('Desafiar '+ playerName + '?') ) {
            game.requestChallenge(playerName);
        }
    };

    return {
        renderGame,
        updatePlayersList,
        removePlayerFromList,
        displayChallengeAlerts
    }
}