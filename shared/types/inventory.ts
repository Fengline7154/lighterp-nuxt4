// shared/types/inventory.ts
import type { IDecimal } from "~~/shared/mappers/baseRepoType/decimal";

/** 库存变动结果，供应用层写流水和成本 */
export interface StockChangeResult {
  productId: string;
  productName: string;
  changedQty: IDecimal; // 变动量（正=入库，负=出库）
  beforeQty: IDecimal; // 变动前总库存
  afterQty: IDecimal; // 变动后总库存
  /** 库位级变动（调拨时有值） */
  locationChanges?: LocationChange[];
}

export interface LocationChange {
  locationId: string;
  changedQty: IDecimal; // 该库位变动量
  beforeQty: IDecimal; // 该库位变动前
  afterQty: IDecimal; // 该库位变动后
}
