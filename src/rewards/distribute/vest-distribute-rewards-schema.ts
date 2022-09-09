// export {};
import algosdk from 'algosdk';

export interface DistributeRewardsInput {
  algodClient: algosdk.Algod,
  distributeNetwork: string,
  fromAccount: algosdk.Account,
  sendAssetId: number,
  indexer: algosdk.Indexer,
  dryRunWithDBSave?: boolean,
  removeOldFirst?: boolean
}

export const schema = {
  type: 'object',
  properties: {
    algodClient: {type: 'object'},
    dryRunWithDBSave: {type: 'boolean'},
    removeOldFirst: {type: 'boolean'},
    amount: {type: 'integer', minimum: 1},
    distributeNetwork: {type: 'string', pattern: '^(mainnet|testnet)$'},
    fromAccount: {
      type: 'object',
      properties: {
        addr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
      },
      required: ['addr'],
    },
    sendAssetId: {type: 'integer'},
    indexer: {type: 'object'},
  },
  required: ['algodClient', 'rewardsDB', 'wallets',
    'amount', 'epoch', 'network', 'accrualNetwork', 'fromAccount', 'assetId',
    'indexer'],
  additionalProperties: false,
};

// export {schema: {...schema}, DistributeRewardsInput};

// module.exports = () => {
//   return {schema: {...schema}, DistributeRewardsInput};
// };
