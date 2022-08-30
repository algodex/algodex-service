#!/bin/bash

mkdir -p log
APP_CONTEXT=asset-worker pm2 -l ./log/asset-worker.log --name asset-worker start built/server.js
APP_CONTEXT=block-worker pm2 -l ./log/block-worker.log --name block-worker start built/server.js
APP_CONTEXT=block-worker pm2 -l ./log/block-worker2.log --name block-worker2 start built/server.js
APP_CONTEXT=block-worker pm2 -l ./log/block-worker3.log --name block-worker3 start built/server.js
APP_CONTEXT=formatted-order-worker pm2 -l ./log/formatted-order-worker.log --name formatted-order-worker start built/server.js
APP_CONTEXT=order-worker pm2 -l ./log --name order-worker -l ./log/order-worker.log start built/server.js
APP_CONTEXT=trade-history-worker pm2 -l ./log/trade-history-worker.log --name trade-history-worker start built/server.js
APP_CONTEXT=broker pm2 -l ./log/broker.log --name broker start built/server.js
APP_CONTEXT=algx-balance-worker pm2 -l ./log/algx-balance-worker.log --name algx-balance-worker start built/server.js

