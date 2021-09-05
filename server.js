const Redis = require('ioredis');
const connection = new Redis(6379, "events");

const uWebSockets = require('uWebSockets.js');
const app = uWebSockets.App();

/**
 * WARNING!! This is not optimized. It pushes all data to the events bus which
 * gets subscribed to in the Client Service layer. The Client service will
 * send all events to it's own websocket subscribers which results in TONS of data.
 * It's just an example of how well the messages flow even in un-ideal situations
 */

// Subscribe to channels
connection.subscribe(`assets`, `orders`, (err, count) => {
    (err) ? console.error("Failed to subscribe: %s", err.message) :
        console.log(`This client is currently subscribed to ${count} channels.`)
});

// Send brokers messages to the client
connection.on("message", (channel, message) => {
    console.log(channel, message.length);
    if(!("key" in channels)){

    }
});

// Construct the socket app
// NOTE: we can add key based channels here: like pattern: /asset/{id}
app.ws('/', {
    open: (ws, asset) => {
        // Send brokers messages to the client
        connection.on("message", (channel, message) => {
            console.log(channel, message.length);
            ws.send(message, false, true);
        });
    },
    close: (ws) => {
        console.log(`WS_CLOSE`);
        connection.removeAllListeners()
    },
})
// If you want REST requests
.get('/*', (res, req) => {
    res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
})
// Set listener ports and start
.listen(9001, (listenSocket) => {
    if (listenSocket) {
        console.log('Listening to port 9001');
    }
});