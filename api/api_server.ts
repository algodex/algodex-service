/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { logRemote, serveGetLogs } from "./log_remote";
import { getV2OrdersByAssetId, serveGetHiddenOrders, serveGetOrdersByAssetId, serveGetOrdersByWallet, serveGetTVL } from "./orders";
import { serveCouchProxy } from "./proxy";
import { isAccruingRewards, 
  get_rewards_per_epoch, save_rewards, serveIsOptedIn, serveGetRewardsDistribution, serveGetLeaderboard, serveRewardsIsRecorded, serveRewardsData, serveVestedRewardsData, serveUnrecordedRewards } from "./rewards";
import { serveCharts, serveAllAssetPrices, serveTradeHistoryByAssetId, serveTradeHistoryByOwner, serveChartsNoCache } from "./trade_history";
import { serve_auth_check } from "./util";
import { serveGetWalletAssets } from "./wallet";
const nocache = require("nocache");
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const express = require('express')

const app = express()
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.enable('etag'); // should be enabled by default anyways
app.use(nocache());

const port = 3006

// Orders

app.get('/asset/hidden/:assetId', serveGetHiddenOrders);
app.get('/orders/asset/:assetId', serveGetOrdersByAssetId);
app.get('/orders/wallet/:ownerAddress', serveGetOrdersByWallet);
app.get('/orders/tvl', serveGetTVL);

// Trade History

app.get('/trades/assets/all', serveAllAssetPrices);
app.get('/trades/history/asset/:assetId', serveTradeHistoryByAssetId);
app.get('/trades/history/wallet/:ownerAddress', serveTradeHistoryByOwner);

// Charts
app.get('/trades/charts/asset/:assetId/period/:period', serveCharts);
//app.get('/trades/charts/asset/:assetId/period/:period/nocache', serveChartsNoCache);


// Wallet

app.get('/wallet/assets/:ownerAddress', serveGetWalletAssets);


// Proxy

app.post('/query/:database/_design/:index/_view/:view', serveCouchProxy);

// Rewards

app.post('/save_rewards', save_rewards);

// curl -v -H 'couch-password: <password>' -X POST http://localhost:3006/auth_check 
app.post('/auth_check', serve_auth_check);

app.get('/rewards/per_epoch/wallet/:wallet', get_rewards_per_epoch);
app.get('/rewards/is_accruing/:wallet', isAccruingRewards);
app.get('/rewards/unrecorded', serveUnrecordedRewards);
app.get('/wallets/leaderboard', serveGetLeaderboard);
app.get('/rewards/optin/:wallet', serveIsOptedIn);
app.get('/rewards_distribution', serveGetRewardsDistribution);
app.get('/rewards/is_recorded/period/:epoch', serveRewardsIsRecorded);
app.get('/rewards/accumulated/wallet/:wallet', serveRewardsData);
app.get('/rewards/vested/wallet/:wallet', serveVestedRewardsData);

// Logging

app.post('/debug/log/post', logRemote);
app.get('/debug/log/get', serveGetLogs);

app.listen(port, () => {
  console.log(`Algodex Service listening on port ${port}`)
})

export {};