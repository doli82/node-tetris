export default function renderScreen(canvas, game, document ) {
    if( !canvas || !canvas.getContext ) {
        console.log('Não foi possível renderizar o jogo! O objeto canvas não pode ser acessado.');
        return;
    }
    const context = canvas.getContext('2d', {alpha: false});
    const colors = [ '#cfd0d5', '#fd823f', '#007ce0', '#fabd08', '#fe1143', '#8dc645', '#ce7bde' ];
    let start = null;
    let challengedBy = null;
    let challenging = null;
    let challengeResults = false;
    let clickable = [];
    let images = [];

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
            const statusText = player.status==='gameover' ? ' (GameOver)' : player.status==='winner' ? ' (Winner)':'';
            const text = `${player.name + statusText}: ${player.score}`;
            context.fillStyle = 'white';
            context.font = "bold 16px Georgia";
            context.shadowBlur = 3;
            context.fillText(text, game.width - context.measureText(text).width - 20, verticalPosition);
            verticalPosition += 20;
        });
    }

    function drawGameOverScreen() {
        const width = canvas.width * 2 / 3;
        const height = 120;
        const x = (canvas.width - width) / 2;
        const y = ( canvas.height - height) / 2;

        const text = 'Game Over!';

        drawRoundedBox(context, x, y, width, height, 9);

        drawText(context,
            (canvas.width - getTextWidth(context, text, 24)) / 2,
            (canvas.height) / 2,
            text, 24, 'white'
        );

        const close = 'Fechar';
        clickable.push( drawButton(context, (canvas.width - getTextWidth(context, close, 14) - 8)/2, (canvas.height + 25) / 2, close, ( event ) => {
            game.resetGame();
        }) );
    }

    function drawPausedScreen() {
        const width = canvas.width * 2 / 3;
        const height = 90;
        const x = (canvas.width - width) / 2;
        const y = ( canvas.height - height) / 2;

        const text = 'Pausa';

        drawRoundedBox(context, x, y, width, height, 9);

        drawText(context,
            (canvas.width - getTextWidth(context, text, 24)) / 2,
            (canvas.height + 18 ) / 2,
            text, 24, 'white'
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
            challenging = null;
        }) );

        clickable.push( drawButton(context, x + width - 90, y + 85, 'Desafiar', (event) => {
            game.requestChallenge(adversaryName);
            challenging = null;
        } ));
    }
    function drawWinnerScreen() {
        const width = canvas.width;
        const height = canvas.height;
        const img = images.find(image=> Object.keys(image).find(key=>key === 'trophy'));
        context.strokeStyle = '#e6e9ec';
        context.fillRect(0, 0, width, height);
        context.stroke();
        
        const title = 'Parabéns!';
        const detail = 'Você venceu';
        const close = 'Fechar';

        drawText(context, ((width - getTextWidth(context, title, 34)) / 2) - 1, 49, title, 34, '#555' );
        drawText(context, (width - getTextWidth(context, title, 34)) / 2, 50, title, 34, '#ffc328' );
        if( img ) {
            drawTrophyAnimation(img.trophy, img.frame, (width - 200) / 2, 80, 200, 200 );
        }
        drawText(context, (width - getTextWidth(context, detail, 18))/2, 320, detail, 18, '#3c5a66' );
        let lineHeight = 55;
        game.getPlayers().map( (player, position) => {
            const name = player.name;
            const score = player.score;
            const color = (player.status === 'winner') ? '#4eab0a' : '#f44336';

            drawText(context, (width - getTextWidth(context, name, 24))/2, 350 + (lineHeight * position),
                name, 24, '#3c5a66'
            );
            drawText(context, (width - getTextWidth(context, score, 24))/2, 374 + (lineHeight * position), score, 32, color);
        });
        clickable.push( drawButton(context, (width - getTextWidth(context, close, 14) - 8)/2, 450, close, ( event ) => {
            game.resetGame();
        }, '#3d5a66') );

    }

    function drawTrophyAnimation(img_object, frame, x, y, width, height) {
        context.beginPath();
        context.drawImage(img_object, frame * width, 0, width, height, x, y, width, height);
        context.closePath();
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
                if( game.isChallenge() && game.isWinner()) {
                    drawWinnerScreen();
                } else {
                    drawGameOverScreen();
                }
            }
        } else if( !game.isGameOver() ) {
            drawPausedScreen();
        }
        // drawWinnerScreen();
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
        if ( players.length < 2 ) {
            const li = document.createElement("li");
            li.setAttribute('class', 'info');
            li.innerHTML = '<i>Nenhum jogador online</i>';
            playersNode.appendChild( li );
        }
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
        const me = game.getCurrentPlayer();
        if ( packet.type === 'ChallengeRequested' ) {
            if( me.status === 'playing' ) {                
                game.respondChallenge(packet.challenger, false );
            } else {
                challengedBy = packet.challenger;
            }
        } else if( packet.type === 'ChallengeResponded' ) {            
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
    window.newGame = (playerName) => { 
        game.newGame();
    };

    function loadImages() {

        const image_trophy = new Image();
        image_trophy.onload = () => {
            images.push({ trophy: image_trophy, frame: 0, speed: 172 });
            const img = images.find(image=> Object.keys(image).find(key=>key === 'trophy'));
            setInterval( () => {                
                img.frame = ( img.frame < 6 ) ? img.frame + 1 : 0;
            }, img.speed);
        };
        image_trophy.src = 'assets/trophy.png';
    }
    
    loadImages();   

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
function drawButton(context, x, y, label, action=null, button_color=null, text_color='white' ) {
    context.beginPath();
    const width = getTextWidth(context, label, 14) + 16;
    const height = 40;
    const fontSize = 14;
    drawRoundedBox(context, x, y, width, height, 8, button_color, button_color);
    drawText(context, x + 8, y + (height + fontSize) / 2, label, fontSize, text_color);
    context.closePath();
    return { position: {x, y}, size: {width, height}, onClick: action };
}
function drawText(context, x, y, text, size, color) {
    context.beginPath();
    context.fillStyle = color;
    context.font = `bold ${size}px Georgia`;
    context.shadowBlur = 6;
    context.fillText( text, x, y );
    context.closePath();
}
function drawImageGif(context, x, y, img_object, width, height) {
    if (img_object === null) return;
    context.drawImage(img_object, x, y, width, height);
}
function getTextWidth(context, text, fontSize) {
    context.font = `bold ${fontSize}px Georgia`;
    return context.measureText(text).width;
}
