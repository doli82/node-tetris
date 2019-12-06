const WebSocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer((request, response) => {
    response.header('Access-Control-Allow-Origin', '*');
    next();
});
server.listen( 3300, () => {
    console.log((new Date()) + ' - Servidor WebSocket escutando na porta: 3300');
} );

const connections = [];

const wsserver = new WebSocketServer({ httpServer: server });

wsserver.on('request', request => {
    const connection = request.accept(null, request.origin);
    console.log((new Date()) , ' Connection from origin ', request);
    connection.on('message', message => console.log('mensagem', message));
    connection.on('close', (connection) => { console.log('close', connection)});
    connections.push( connection );
});