# Algodex Gradation

[![doc-coverage](./assets/badge.svg)](https://esdoc.org/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![@algodex/service](https://github.com/algodex/algodex-node-gradation/actions/workflows/package.yml/badge.svg?branch=main)](https://github.com/algodex/algodex-node-gradation/actions/workflows/package.yml)
[![algodex/service:image](https://github.com/algodex/algodex-node-gradation/actions/workflows/docker-image.yml/badge.svg?branch=main)](https://github.com/algodex/algodex-node-gradation/actions/workflows/docker-image.yml)

Inspired by:
https://en.wikipedia.org/wiki/Soil_gradation

We treat the chain-data as "**Poorly Graded**" and use a [**Mesage Broker**](./services/broker.js)
to "**Classify**" the raw data stream from the contracts index. You can think of the **Broker** as a metaphorical
"sifter" of "sieve".

Some concepts are universal and don't require ECMAScript, we are using it for simplicity and sanity.
The geological terms are used to help visualize the data problem

You can find the contribution guides for getting started in [./CONTRIBUTING.md](./CONTRIBUTING.md)

<p align="center"><img src="/assets/images/dream.drawio.png?raw=true"/></p>


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


# Scaling
These terms are designed to reason with the data in a sane way. These 
are non standard technology terms but are useful in understanding the problem.
There is a hard client side 50MB hard cap unless we go Hybrid application.

Data limitations: https://pouchdb.com/faq.html#data_limits

This system can be scaled horizontally in two primary ways. First
is simple duplication of workers and servers. Second: If this model breaks down
we can then start to partition the keys, but it should be viable for the
vast majority of our use case. Further optimizations can be done in
a **ProtocolBuffer** if need be to increase throughput and decrease size


## Classification Terms:

<p align="center"><img src="https://upload.wikimedia.org/wikipedia/commons/0/0f/Sample_Net-withGraphic.png"/></p>

### Sand (Dropplets)

Free flowing data that can easily be serialized in all systems. It is granular in nature and
should be the minimum viable for your data model. Sand should be sent directly to the client
as it flows in. Rolling window is large but still limited.

#### Example:

- Size on Disk: 45B
- Theoretical: 1165084.44444 Records
- Estimate: 100-200k records

```json
{
  "id": "asset_15322902",
  "name": "LAMP",
  "created-at-round": 13596306,
  "params": "asset_15322902_params"
}
```

### Pebbles (Streams)

This data can be free flowing as long as we restrict the window. It can include many
bits of sand by abusing key definitions. These should not be streamed into client storage and only used upon request.
They can be cached in a local store as long as there is good business reasons to do so

- Size on Disk: 506B
- Theoretical: 103614.229249
- Estimate: 10-30k records

#### Example:
```json
{
  "id": "asset_15322902_params",
  "clawback": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
  "creator": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
  "decimals": 6,
  "default-frozen": false,
  "freeze": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
  "manager": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
  "name": "Lamps",
  "name-b64": "TGFtcHM=",
  "reserve": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
  "total": 100000000000,
  "unit-name": "LAMP",
  "unit-name-b64": "TEFNUA=="
}
```

### Rocks (Lakes)

Rocks are bulky, data which should not be streamed to any device other than
stream workers/processors. They can be requested directly from the database with
further optimizations like MapReduce. Once they are fetched, you can add pebbles/sand
in append only to this classification set. This can use a **include_docs** request
to fetch associated documents from the database

- Size on Disk: ~
- Theoretical: ~
- Estimate: 1 Record (with restricted window)

#### Mapped Example:
```json
{
  "query": "order_asset_15322902",
  "buy": [
    "order_asset_15322902_tx1",
    "order_asset_15322902_tx2",
    "order_asset_15322902_tx3",
    "order_asset_15322902_tx4",
    "order_asset_15322902_tx5",
    "order_asset_15322902_tx6"
  ],
  "sell": [
    "order_asset_15322902_tx1",
    "order_asset_15322902_tx2",
    "order_asset_15322902_tx3",
    "order_asset_15322902_tx4",
    "order_asset_15322902_tx5",
    "order_asset_15322902_tx6"
  ]
}
```

### Boulders (Oceans)

Boulders are immovable, raw bulk data that either shouldn't be processed or fetched by any clients.
This data can be mapped and reduced but should never be called on directly.

The **Broker** is responsible for reasoning with **Boulders**. Any **Sand** and|or **Pebble** parts of the stream
that can be sent to the client should be emitted immediately. The **Boulder** can be smashed into **Rocks** and|or
**Pebbles** for future processing. The **Boulder** can be placed directly into the database for MapReduce.

- Size on Disk: Petabytes
- Theoretical: ~
- Estimate: > 1M

#### Example:
```json
[
  {
      "id": "asset_15322902_params",
      "clawback": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
      "creator": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
      "decimals": 6,
      "default-frozen": false,
      "freeze": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
      "manager": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
      "name": "Lamps",
      "name-b64": "TGFtcHM=",
      "reserve": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
      "total": 100000000000,
      "unit-name": "LAMP",
      "unit-name-b64": "TEFNUA=="
  },
  {
    "query": "order_asset_15322902",
    "buy": [
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx"
    ],
    "sell": [
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx"
    ]
  },
  {
    "query": "order_asset_15322902",
    "buy": [
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx"
    ],
    "sell": [
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx"
    ]
  },
  {
    "query": "order_asset_15322902",
    "buy": [
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx"
    ],
    "sell": [
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx"
    ]
  },
  {
    "query": "order_asset_15322902",
    "buy": [
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx"
    ],
    "sell": [
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx",
      "order_asset_15322902_tx"
    ]
  },
  {
    "id": "asset_15322902_params",
    "clawback": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "creator": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "decimals": 6,
    "default-frozen": false,
    "freeze": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "manager": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "name": "Lamps",
    "name-b64": "TGFtcHM=",
    "reserve": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "total": 100000000000,
    "unit-name": "LAMP",
    "unit-name-b64": "TEFNUA=="
  },
  {
    "id": "asset_15322902_params",
    "clawback": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "creator": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "decimals": 6,
    "default-frozen": false,
    "freeze": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "manager": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "name": "Lamps",
    "name-b64": "TGFtcHM=",
    "reserve": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "total": 100000000000,
    "unit-name": "LAMP",
    "unit-name-b64": "TEFNUA=="
  },
  {
    "id": "asset_15322902_params",
    "clawback": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "creator": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "decimals": 6,
    "default-frozen": false,
    "freeze": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "manager": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "name": "Lamps",
    "name-b64": "TGFtcHM=",
    "reserve": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "total": 100000000000,
    "unit-name": "LAMP",
    "unit-name-b64": "TEFNUA=="
  },
  {
    "id": "asset_15322902_params",
    "clawback": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "creator": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "decimals": 6,
    "default-frozen": false,
    "freeze": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "manager": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "name": "Lamps",
    "name-b64": "TGFtcHM=",
    "reserve": "PBSSJ2W6FDXVRPT4L4FGHTX2IHY3VREI44SB7VJTVT75UT6ER3CTVD6B74",
    "total": 100000000000,
    "unit-name": "LAMP",
    "unit-name-b64": "TEFNUA=="
  }
]
```

<p align="center">
  <img alt="Kill all humans" src="https://github.com/semantic-release/semantic-release/raw/master/media/bender.png">
</p>


