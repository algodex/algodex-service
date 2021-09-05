# 🧦 Algodex

This system can be scaled horizontally in two primary ways. First
is simple duplication of workers and servers. If this model breaks down
we can then start to partition the keys. These concepts are universal and 
don't require ECMAScript, we are using it for simplicity and sanity.

## Core Packages

- Sockets/REST(optional): https://github.com/uNetworking/uWebSockets.js/
- Queue/Worker: https://docs.bullmq.io/
- Events(Pub/Sub): https://github.com/luin/ioredis#pubsub
- Database: https://pouchdb.com/api.html https://docs.couchdb.org/en/main/intro/index.html


## Core Services

- Broker (Event Publisher->Queue|Sockets): [./services/broker.js](./services/broker.js)
  - All "Events" are published and pushed to Queue for basic example
- Worker (BullMQ Worker): [./services/worker.js](./services/worker.js)
  - Removes items from the Queue and stores them in the Database
- Socket (Event Subscriber and Socket Publisher ): [./server.js](./server.js)
  - Push Broker Events to Subscribed Sockets. 
  - Future example: ```ws://localhost/asset/{id}``` would subscribe to the 
   appropriate redis channel coming from the **Broker**

# Getting Started

Run the example

```bash
docker-compose up
```
 
- Website: http://localhost
- Redis Commander: http://localhost:8081/
- Couch Futon: http://localhost:5984/_utils/#login
  - Username: admin
  - Password: dex
- Optional API: http://localhost:9001 | Proxied http://localhost/api
