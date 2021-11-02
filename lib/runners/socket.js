// Slow but simple WebSocket Server, no hard dependency on Linux like uws
import {WebSocketServer} from 'ws';
import useLogger from '@algodex/common/lib/utility/logger.js';
const log = useLogger();
/**
 * Run the socket server
 * @param {Redis} events
 */
export default function socket({events}) {
  const PORT = process.env.PORT || 9001;
  log.debug({
    msg: `🚀 Starting Socket Service on port ${PORT}`,
  });
  const wss = new WebSocketServer({port: PORT});

  wss.on('connection', function connection(ws) {
    const shutdown = (...args) => {
      log.info({
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
      (err) ? log.error('Failed to subscribe: %s', err.message) :
      log.debug({
        msg: '✅ Subscribed',
        events: state,
        count,
      });
    });

    ws.on('message', function(message) {
      log.info({
        msg: '⚡ Client Message',
        message: message.toString(),
      });
      state.push(message.toString());
      if (message.includes('cancel')) {
        clientEvents.unsubscribe(...state);
        state = [];
      } else {
        // Subscribe to channels
        clientEvents.subscribe(message, (err, count) => {
          (err) ? log.error('Failed to subscribe: %s', err.message) :
          log.debug({
            msg: '➕ Subscription(s)',
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
      log.debug({
        msg: '⚡ Sub',
        channel,
        message,
        sockets: wss.clients.size,
        clients: parseInt(clientEvents.serverInfo.connected_clients),
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
//             log.info(channel, message.length);
//             ws.send(message, false, true);
//         });
//     },
//     close: (ws) => {
//         log.info(`WS_CLOSE`);
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
//         log.info('Listening to port 9001');
//     }
// });
};


