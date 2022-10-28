import { getDatabase } from "./util"

export interface AssetInfo {
  _id: string
  _rev: string
  type: string
  asset: Asset
  "current-round": number
}

export interface Asset {
  "created-at-round": number
  deleted: boolean
  index: number
  params: Params
}

export interface Params {
  clawback: string
  creator: string
  decimals: number
  "default-frozen": boolean
  freeze: string
  manager: string
  name: string
  "name-b64": string
  reserve: string
  total: number
  "unit-name": string
  "unit-name-b64": string
}

export const getAssetInfo = async (assetId:number):Promise<AssetInfo> => {
  const db = getDatabase('assets');
  const assetInfo = await db.get(assetId+'');
  return assetInfo;
}