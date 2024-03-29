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

export interface AssetUnitName {
  assetId: number
  unitName: string
}

export const getUnitNames = async (assetIds:Set<number>):Promise<AssetUnitName[]> => {
  const db = getDatabase('assets');

  const assetIdsArr = Array.from(assetIds).map(assetId => ''+assetId);

  const assetUnitNames = await db.query('assets/unitNames', {
    keys: assetIdsArr
  });

  return assetUnitNames.rows.map(row => ({assetId: parseInt(row.key), unitName: row.value}));
}

export interface AssetSummaryInfo {
  assetId: number
  unitName: string
  name: string
  decimals: number
  verified: boolean
  total: number
}


export const getSummaryInfo = async (assetIds:Set<number>):Promise<AssetSummaryInfo[]> => {
  const db = getDatabase('assets');

  const assetIdsArr = Array.from(assetIds).map(assetId => ''+assetId);

  const assetSummaryInfo = await db.query('assets/summaryInfo', {
    keys: assetIdsArr
  });

  return assetSummaryInfo.rows.map(row => ({assetId: parseInt(row.key), ...row.value}));
}
