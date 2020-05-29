export interface GetLocationParams {
  customerId: string;
}

export interface AssetTypeRecord extends TotalCount {
  typeId: string;
}

export interface RegionRecord extends TotalCount {
  regionId: string;
}

export interface CustomerRecord extends TotalCount {
  customerId: string;
}

export interface LocationRecord extends TotalCount {
  customerId: string;
  locationId: string;
}

export interface TotalCount {
  totalCount: string;
}
