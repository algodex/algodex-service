// Slow but simple WebSocket Server, no hard dependency on Linux like uws
const WebSocketServer = require('ws').WebSocketServer;

module.exports = ({events}) => {
  console.debug({
    msg: '🧙‍ Starting Socket Service',
  });
  const wss = new WebSocketServer({port: 9001});

  wss.on('connection', function connection(ws) {
    const shutdown = (...args) => {
      console.log({
        msg: '💥 Shutting Down',
        args,
      });
      ws.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    let state = [`assets`];
    // Subscribe to channels
    const clientEvents = events.duplicate();

    clientEvents.subscribe(...state, (err, count) => {
      (err) ? console.error('Failed to subscribe: %s', err.message) :
      console.debug({
        msg: '👋 Subscribed',
        events: state,
        count,
      });
    });

    ws.on('message', function(message) {
      console.log({
        msg: '⚡ Client Event',
        message,
      });
      state.push(message.toString());
      if (message.includes('cancel')) {
        clientEvents.unsubscribe(...state);
        state = [];
      } else {
        // Subscribe to channels
        clientEvents.subscribe(message, (err, count) => {
          (err) ? console.error('Failed to subscribe: %s', err.message) :
          console.debug({
            msg: '➕ Adding Subscription',
            events: state,
            count,
          });
        });
      }
    });

    ws.on('close', ()=>{
      clientEvents.removeAllListeners();
    });

    // Send brokers messages to the client
    clientEvents.on('message', (channel, message) => {
      console.log({
        msg: '⚡ Redis Event',
        channel,
        message,
        sockets: wss.clients.size,
        clients: clientEvents.serverInfo.connected_clients,
      });
      ws.send(JSON.stringify({
        type: channel,
        data: JSON.parse(message),
      }));
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
// res.writeStatus('200 OK').writeHeader('IsExample', 'Yes')
// .end('Hello there!');
// })
// // Set listener ports and start
// .listen(9001, (listenSocket) => {
//     if (listenSocket) {
//         console.log('Listening to port 9001');
//     }
// });
};


