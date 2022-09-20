
interface WrappedNumber {
  val: number
}

interface OwnerRewardsResult {
  algxBalanceSum: WrappedNumber,
  qualitySum: WrappedNumber,
  uptime: WrappedNumber,
  depth: WrappedNumber,
  sumDepth: WrappedNumber,
  algoTotalDepth: WrappedNumber,
  asaTotalDepth: WrappedNumber
}

interface EarnedAlgxEntry {
  quality: WrappedNumber,
  earnedAlgx: WrappedNumber
}

// These should be simple maps, but no easy way to do this
interface OwnerRewardsAssetToResMapObj {
  [key: string]: OwnerRewardsResult
}
interface OwnerRewardsWalletToAssetMapObj {
  [key: string]: OwnerRewardsAssetToResMapObj
}

interface OwnerWalletAssetToFinalRewardsMapObj {
  [key: string]: EarnedAlgxEntry
}

interface SaveRewardsRequest {
  ownerRewards: OwnerRewardsWalletToAssetMapObj,
  ownerRewardsResToFinalRewardsEntry: OwnerWalletAssetToFinalRewardsMapObj,
  epoch: number
}

interface CouchRewardsData {
  _id: string,
  _rev?: string,
  ownerWallet: string,
  uptime: number,
  depthSum: number,
  depthRatio: number,
  qualitySum: number,
  algxAvg: number,
  algoTotalDepth: number,
  asaTotalDepth: number,
  qualityFinal: number,
  earnedRewardsFormatted: number,
  epoch: number,
  rewardsAssetId: number,
  accrualAssetId: number,
  updatedAt: string
}

interface OwnerRewardsKey {
  wallet: string,
  assetId: number
}



interface HighestBid {
  maxPrice: number|null,
  isAlgoBuyEscrow: boolean,
}
interface LowestAsk {
  minPrice: number|null,
  isAlgoBuyEscrow: boolean,
}
interface Spread {
  highestBid:HighestBid,
  lowestAsk:LowestAsk
}

interface V1OrdersInnerResult {
  formattedPrice:string,
  escrowAddress:string
}
interface V1OrdersResult {
  buyASAOrdersInEscrow:Array<V1OrdersInnerResult>,
  sellASAOrdersInEscrow:Array<V1OrdersInnerResult>,
  assetId:number,
  timer?:NodeJS.Timeout
}
interface V2OrdersResult {
  escrowAddress: string
}

