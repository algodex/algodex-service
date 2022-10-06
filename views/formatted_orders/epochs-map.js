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

// @ts-nocheck

module.exports = function(doc) {
  const unixToEpoch = unixTime => {
    const rounded = Math.floor(unixTime);
    const start = 1644501600; // start time. change mainnet or testnet
    const secondsInEpoch = 604800;
    return Math.floor((rounded - start) / secondsInEpoch) + 1;
  };

  const getEpochFromEscrow = escrow => {
    const history = escrow.history;
    let startTime = null;
    let endTime = null;
    const epochSet = {};
    for (let i = 0; i < history.length; i++) {
      const hasBalance = history[i].asaAmount > 0 || history[i].algoAmount > 0;
      if (startTime === null && hasBalance) {
        startTime = history[i].time;
      } else if (startTime !== null && !hasBalance) {
        endTime = history[i].time;
        const startEpoch = unixToEpoch(startTime);
        const endEpoch = unixToEpoch(endTime);
        const epochCount = endEpoch - startEpoch + 1;
        const epochs = Array(epochCount)
            .fill().map((element, index) => index + startEpoch);
        epochs.forEach(epoch => epochSet[`epoch:${epoch}`] = 1);
        startTime = null;
        endTime = null;
      }
    }
    const lastIndex = history.length - 1;
    let stillOpen = false;
    if (history[lastIndex].asaAmount > 0 || history[lastIndex].algoAmount > 0) {
      const lastEpoch = unixToEpoch(history[lastIndex].time);
      epochSet[`epoch:${lastEpoch}`] = 1;
      stillOpen = true;
    }
    const epochs = Object.keys(epochSet).map( key => key.split(':')[1]);
    return {
      epochs,
      stillOpen,
    };
  };

  if (doc.data === undefined) {
    return;
  }
  if (doc.data.history === undefined) {
    return;
  }
  if (doc.data.history.length === 0) {
    return;
  }

  const historyData = {
    address: doc._id,
    history: doc.data.history,
  };

  const epochData = getEpochFromEscrow(historyData);
  epochData.epochs.forEach(epoch => {
    emit(epoch, doc._id);
  });
  if (epochData.stillOpen) {
    emit('stillOpen', doc._id);
  }
};
