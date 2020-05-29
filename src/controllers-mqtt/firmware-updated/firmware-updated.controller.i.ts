import { IsInt, IsString, IsOptional, ValidateNested, Equals, IsNotEmpty } from "class-validator";

import { Type } from "class-transformer";

import { EMessageType, EMessageName, SubscribeAssetMetaData } from "../mqtt-message.i";

export class FirmwareUpdatedEventDetail {
  @IsString({ each: true })
  public package?: string[];
}

export class FirmwareUpdatedPayload {
  @Equals(EMessageType.Event)
  public type!: EMessageType;

  @Equals(EMessageName.FirmwareUpdated)
  public name!: EMessageName;

  @IsInt()
  public version!: number;

  @IsString()
  @IsOptional()
  public sender?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SubscribeAssetMetaData)
  public assetMetaData!: SubscribeAssetMetaData;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FirmwareUpdatedEventDetail)
  public detail!: FirmwareUpdatedEventDetail;
}
