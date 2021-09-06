// Slow but simple WebSocket Server, no hard dependency on Linux like uws
const WebSocketServer = require('ws').WebSocketServer;

module.exports = ({events, queues}) => {
    const wss = new WebSocketServer({ port: 9001 })

    wss.on('connection', function connection(ws) {
        let state = [`assets`];
        // Subscribe to channels
        let client = events.duplicate();

        client.subscribe(...state, (err, count) => {
            (err) ? console.error("Failed to subscribe: %s", err.message) :
                console.log(`This client is currently subscribed to ${count} channels.`)
        });

        ws.on('message', function (message) {
            state.push(message)
            if(message.includes("cancel")){
                client.unsubscribe(...state)
                state = []
            } else {
                // Subscribe to channels
                client.subscribe(message, (err, count) => {
                    (err) ? console.error("Failed to subscribe: %s", err.message) :
                        console.log(`This client is currently subscribed to ${count} channels.`)
                });
            }

        });

        ws.on('close', ()=>{
            client.removeAllListeners()
        })

        // Send brokers messages to the client
        client.on("message", (channel, message) => {
           ws.send(message);
        });
    });

// NOTE: Example of uWebSockets, a much faster WebSocket implementation
// const uWebSockets = require('uWebSockets.js');
// const app = uWebSockets.App();
// // Construct the socket app
// app.ws('/', {
//     open: (ws, asset) => {
//         // Send brokers messages to the client
//         connection.on("message", (channel, message) => {
//             console.log(channel, message.length);
//             ws.send(message, false, true);
//         });
//     },
//     close: (ws) => {
//         console.log(`WS_CLOSE`);
//         connection.removeAllListeners()
//     },
// })
// // If you want REST requests
// .get('/*', (res, req) => {
//     res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
// })
// // Set listener ports and start
// .listen(9001, (listenSocket) => {
//     if (listenSocket) {
//         console.log('Listening to port 9001');
//     }
// });
}


