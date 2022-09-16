import { logRemote, serveGetLogs } from "./log_remote";
import { getV2OrdersByAssetId, serveGetHiddenOrders, serveGetOrdersByAssetId, serveGetOrdersByWallet } from "./orders";
import { serveCouchProxy } from "./proxy";
import { isAccruingRewards, 
  get_rewards_per_epoch, save_rewards, serveIsOptedIn, serveGetRewardsDistribution, serveGetLeaderboard } from "./rewards";
import { serveCharts, serveTradeHistoryByAssetId, serveTradeHistoryByOwner } from "./trade_history";
import { serveGetWalletAssets } from "./wallet";

/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const express = require('express')

const app = express()
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
const port = 3006

// Orders

app.get('/asset/hidden/:assetId', serveGetHiddenOrders);
app.get('/orders/asset/:assetId', serveGetOrdersByAssetId);
app.get('/orders/wallet/:ownerAddress', serveGetOrdersByWallet);

// Trade History

app.get('/trades/history/asset/:assetId', serveTradeHistoryByAssetId);
app.get('/trades/history/wallet/:ownerAddress', serveTradeHistoryByOwner);

// Charts
app.get('/trades/charts/asset/:assetId/period/:period', serveCharts);

// Wallet

app.get('/wallet/assets/:ownerAddress', serveGetWalletAssets);


// Proxy

app.post('/query/:database/_design/:index/_view/:view', serveCouchProxy);

// Rewards

app.post('/save_rewards', save_rewards);
app.get('/rewards/per_epoch/wallet/:wallet', get_rewards_per_epoch);
app.get('/rewards/is_accruing/:wallet', isAccruingRewards);
app.get('/wallets/leaderboard', serveGetLeaderboard);
app.get('/rewards/optin/:wallet', serveIsOptedIn);
app.get('/rewards_distribution', serveGetRewardsDistribution);

// Logging

app.post('/debug/log/post', logRemote);
app.get('/debug/log/get', serveGetLogs);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

export {};