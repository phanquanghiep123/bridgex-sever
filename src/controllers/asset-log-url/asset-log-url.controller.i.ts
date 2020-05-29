import { IsString, IsNotEmpty } from "class-validator";

export class AssetLogUrlControllerGetParams {
  @IsString()
  @IsNotEmpty()
  public readonly taskId!: string;

  @IsString()
  @IsNotEmpty()
  public readonly typeId!: string;

  @IsString()
  @IsNotEmpty()
  public readonly assetId!: string;
}

export interface AssetLogUrlControllerGetResponse {
  assetLogURL: string;
}
