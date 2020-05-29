import { Injectable } from "@nestjs/common";

import { Observable, throwError } from "rxjs";

import { catchError, map } from "rxjs/operators";

import {
  EMessageType,
  EMessageName,
  MqttMessage,
  MqttReturnData,
  MqttEventCreateSessionDetail,
  MqttActionCreateSessionDetail,
  MqttActionCloseSessionDetail,
  MqttCommandDownloadPackageDetail,
  MqttCommandRetrieveLogDetail,
  SendCreateSessionParams,
  SendCloseSessionParams,
  DownloadPackageParams,
  SendCloseSessionActionParams,
  SendCreateSessionActionParams,
  UploadRetrieveLogParams,
  InstallParams,
  MqttCommandInstallDetail,
  SendRebootParams,
  SendSelfTestParams,
} from "./mqtt-publish.service.i";

import { ErrorCode } from "../utils";

import { LoggerService } from "../logger/logger.service";

import { MqttClientService } from "../mqtt-client";

// --------------------------------------------

@Injectable()
export class MqttPublishService {
  public constructor(public client: MqttClientService, public logger: LoggerService) {}

  public publish$<T>(topic: string, payload: MqttMessage<T>): Observable<MqttReturnData<T>> {
    payload = { version: 1, sender: "bridge-x-server", ...payload };

    return this.client.publish$(topic, payload).pipe(
      map(() => ({ topic, payload })),
      catchError((e) => {
        this.logger.error(e);
        return throwError(ErrorCode.categorize(e));
      }),
    );
  }

  public publishRetain$<T>(topic: string, payload: MqttMessage<T>): Observable<MqttReturnData<T>> {
    payload = { version: 1, sender: "bridge-x-server", ...payload };

    return this.client.publishRetain$(topic, payload).pipe(
      map(() => ({ topic, payload })),
      catchError((e) => {
        this.logger.error(e);
        return throwError(ErrorCode.categorize(e));
      }),
    );
  }

  public releaseRetain$(topic: string): Observable<MqttReturnData<string>> {
    return this.client.releaseRetain$(topic).pipe(
      catchError((e) => {
        this.logger.error(e);
        return throwError(ErrorCode.categorize(e));
      }),
    );
  }

  /**
   * @deprecated for PoC1. will remove at PoC1.5 or later
   */
  public createSessionEvent$(params: SendCreateSessionParams): Observable<MqttReturnData<MqttEventCreateSessionDetail>> {
    const topic = `/glory/g-connect/${params.typeId}/${params.assetId}/event/${EMessageName.CreateSession}`;
    const payload: MqttMessage<MqttEventCreateSessionDetail> = {
      type: EMessageType.Event,
      name: EMessageName.CreateSession,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
      },
      detail: {
        sessionId: params.sessionId,
        topicPrefix: params.topicPrefix,
      },
    };

    return this.publish$(topic, payload);
  }

  /**
   * @deprecated for PoC1. will remove at PoC1.5 or later
   */
  public closeSessionCommand$(params: SendCloseSessionParams): Observable<MqttReturnData<unknown>> {
    const topic = `${params.sessionTopic}/command/${EMessageName.CloseSession}`;
    const payload: MqttMessage<unknown> = {
      type: EMessageType.Command,
      name: EMessageName.CloseSession,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
        sessionId: params.sessionId,
        messageId: params.messageId,
      },
    } as MqttMessage<unknown>;

    return this.publish$(topic, payload);
  }

  public createSessionAction$(params: SendCreateSessionActionParams): Observable<MqttReturnData<MqttActionCreateSessionDetail>> {
    const topic = `/glory/g-connect/${params.typeId}/${params.assetId}/action/${EMessageName.CreateSession}`;
    const payload: MqttMessage<MqttActionCreateSessionDetail> = {
      type: EMessageType.Action,
      name: EMessageName.CreateSession,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
      },
      detail: {
        sessionId: params.sessionId,
        topicPrefix: params.topicPrefix,
      },
    };

    return this.publish$(topic, payload);
  }

  public closeSessionAction$(params: SendCloseSessionActionParams): Observable<MqttReturnData<MqttActionCloseSessionDetail>> {
    const topic = `/glory/g-connect/${params.typeId}/${params.assetId}/action/${EMessageName.CloseSession}`;
    const payload: MqttMessage<MqttActionCloseSessionDetail> = {
      type: EMessageType.Action,
      name: EMessageName.CloseSession,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
      },
      detail: {
        sessionId: params.sessionId,
        topicPrefix: params.topicPrefix,
      },
    };

    return this.publish$(topic, payload);
  }

  public downloadPackageCommand$(params: DownloadPackageParams): Observable<MqttReturnData<MqttCommandDownloadPackageDetail>> {
    const topic = `${params.sessionTopic}/command/${EMessageName.DownloadPackage}`;
    const payload: MqttMessage<MqttCommandDownloadPackageDetail> = {
      type: EMessageType.Command,
      name: EMessageName.DownloadPackage,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
        sessionId: params.sessionId,
        messageId: params.messageId,
      },
      detail: {
        packageId: params.packageId,
        protocol: params.protocol,
        url: params.url,
        username: params.username,
        password: params.password,
      },
    };

    return this.publishRetain$(topic, payload);
  }

  public installCommand$(params: InstallParams): Observable<MqttReturnData<MqttCommandInstallDetail>> {
    const topic = `${params.sessionTopic}/command/${EMessageName.Install}`;
    const payload: MqttMessage<MqttCommandInstallDetail> = {
      type: EMessageType.Command,
      name: EMessageName.Install,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
        sessionId: params.sessionId,
        messageId: params.messageId,
      },
      detail: {
        packageId: params.packageId,
      },
    };

    return this.publishRetain$(topic, payload);
  }

  public uploadRetrieveLogCommand$(params: UploadRetrieveLogParams): Observable<MqttReturnData<MqttCommandRetrieveLogDetail>> {
    const topic = `${params.sessionTopic}/command/${EMessageName.RetrieveLog}`;
    const payload: MqttMessage<MqttCommandRetrieveLogDetail> = {
      type: EMessageType.Command,
      name: EMessageName.RetrieveLog,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
        sessionId: params.sessionId,
        messageId: params.messageId,
      },
      detail: {
        type: params.type,
        protocol: params.protocol,
        url: params.url,
        filename: params.filename,
        username: params.username,
        password: params.password,
      },
    };

    return this.publishRetain$(topic, payload);
  }

  public sendRebootCommand$(params: SendRebootParams): Observable<MqttReturnData<unknown>> {
    const topic = `${params.sessionTopic}/command/${EMessageName.Reboot}`;
    const payload: MqttMessage<unknown> = {
      type: EMessageType.Command,
      name: EMessageName.Reboot,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
        sessionId: params.sessionId,
        messageId: params.messageId,
      },
    } as MqttMessage<unknown>;

    return this.publishRetain$(topic, payload);
  }

  public sendSelfTestCommand$(params: SendSelfTestParams): Observable<MqttReturnData<unknown>> {
    const topic = `${params.sessionTopic}/command/${EMessageName.SelfTest}`;
    const payload: MqttMessage<unknown> = {
      type: EMessageType.Command,
      name: EMessageName.SelfTest,
      assetMetaData: {
        typeId: params.typeId,
        assetId: params.assetId,
        sessionId: params.sessionId,
        messageId: params.messageId,
      },
    } as MqttMessage<unknown>;

    return this.publishRetain$(topic, payload);
  }
}
