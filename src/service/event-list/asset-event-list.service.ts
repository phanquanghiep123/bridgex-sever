import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

import {
  ConnectedParams,
  DisconnectedParams,
  EstablishedParams,
  AssetStatusErrorParams,
  FirmwareUpdatedParams,
} from "./event-list.service.i";

import { LoggerService } from "../logger/logger.service";
import { EventListService } from ".";

@Injectable()
export class AssetEventListService {
  public constructor(public service: EventListService, public logger: LoggerService) {}

  public insertConnected$(params: ConnectedParams): Observable<null> {
    return this.service.insertAssetEvent$<ConnectedParams>(
      this.service.importanceMap.event.connected,
      this.service.subjectMap.event.connected,
      params,
    );
  }

  public insertDisconnected$(params: DisconnectedParams): Observable<null> {
    return this.service.insertAssetEvent$<DisconnectedParams>(
      this.service.importanceMap.event.disconnected,
      this.service.subjectMap.event.disconnected,
      params,
    );
  }

  public insertEstablished$(params: EstablishedParams): Observable<null> {
    return this.service.insertAssetEvent$<EstablishedParams>(
      this.service.importanceMap.event.established,
      this.service.subjectMap.event.established,
      params,
    );
  }

  public insertAssetStatusError$(params: AssetStatusErrorParams): Observable<null> {
    return this.service.insertAssetEvent$<AssetStatusErrorParams>(
      this.service.importanceMap.event.assetStatusError,
      this.service.subjectMap.event.assetStatusError,
      params,
    );
  }

  public insertFirmwareUpdated$(params: FirmwareUpdatedParams): Observable<null> {
    return this.service.insertAssetEvent$<FirmwareUpdatedParams>(
      this.service.importanceMap.event.firmwareUpdated,
      this.service.subjectMap.event.firmwareUpdated,
      params,
    );
  }
}
