# Algodex Service

This is the 2.0 backend (essentially a custom blockchain indexer) for Algodex and also includes the rewards calculations.

[![@algodex/service](https://github.com/algodex/algodex-service/actions/workflows/package.yml/badge.svg?branch=main)](https://github.com/algodex/algodex-service/actions/workflows/package.yml)
[![algodex/service:image](https://github.com/algodex/algodex-service/actions/workflows/docker-image.yml/badge.svg?branch=main)](https://github.com/algodex/algodex-service/actions/workflows/docker-image.yml)

You can find the contribution guides for getting started in [CONTRIBUTING.md](.github/CONTRIBUTING.md)

Algodex Documentation: https://docs.algodex.com

# Getting Started 

### *Todo: Below instructions are very incomplete!*

## Building rust rewards calculation on ubuntu

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sudo apt install build-essential
sudo apt-get install pkg-config libssl-dev
cd rewards-calc
cargo build
```

### Testing (Localhost with Docker Data)
First make sure CouchDB and Redis services are running according to .integration.test.env. The node.js should *not* be running as these will be started by the end-to-end test.

### Quick Start for CouchDB and Redis Services
```shell
cp .testnet.docker.env .env
docker-compose up -f docker-compose.yml -f docker-compose.docker.yml
```

### Set up reverse-proxy

(todo)
The reverse proxy sits in front of algodex-service. The basic request flow is nginx -> reverse-proxy-rust -> algodex-service API

Some instructions are at https://github.com/algodex/reverse-proxy-rust

### Integration Test Run

```shell
npm run end-to-end-light 
```


- Website: http://localhost:8080
- Redis Commander: http://localhost:8081/
- Couch Futon: http://localhost:5984/_utils/#login
  - Username: admin
  - Password: dex

## Core Packages

- Sockets/REST(optional): https://github.com/uNetworking/uWebSockets.js/
- Queue/Worker: https://docs.bullmq.io/
- Events(Pub/Sub): https://github.com/luin/ioredis#pubsub
- Database: https://pouchdb.com/api.html https://docs.couchdb.org/en/main/intro/index.html
- Reverse Proxy: https://github.com/algodex/reverse-proxy-rust

## Core Services

- Broker (Event Publisher->Queue|Sockets): [./services/broker.js](./services/broker.js)
  - All "Events" are published and pushed to Queue for basic example
- Worker (BullMQ Worker): [./services/worker.js](./services/worker.js)
  - Removes items from the Queue and stores them in the Database
- Socket (Event Subscriber and Socket Publisher - only partially implemented): [./server.js](./server.js)
  - Push Broker Events to Subscribed Sockets. 
  - Future example: ```ws://localhost/asset/{id}``` would subscribe to the 
   appropriate redis channel coming from the **Broker**
  
- API endpoint: [./api/api_server.ts](./api/api_server.ts)
- Rewards Calculator [./rewards-calc/src/main.rs](./rewards-calc/src/main.rs)


