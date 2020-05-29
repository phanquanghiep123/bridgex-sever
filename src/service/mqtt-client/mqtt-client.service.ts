import { Injectable, Inject, OnModuleDestroy } from "@nestjs/common";

import { ClientMqtt } from "@nestjs/microservices/client/client-mqtt";

import { bindNodeCallback, Observable } from "rxjs";

import { map } from "rxjs/operators";

import { MqttClient, IClientPublishOptions } from "mqtt";

import { LoggerService } from "../logger/logger.service";

// ----------------------------------------------

export type MqttPublishOptions = IClientPublishOptions;

export interface MqttReturnData {
  topic: string;
  payload: any;
  opts: MqttPublishOptions;
}

@Injectable()
export class MqttClientService implements OnModuleDestroy {
  private client: MqttClient;

  public constructor(@Inject("MqttService") mqttService: ClientMqtt, public logger: LoggerService) {
    this.client = mqttService.createClient();
  }

  public onModuleDestroy() {
    if (!this.client.disconnecting) {
      this.client.end();
      this.logger.info("disconnecting with mqtt broker");
    }
  }

  public publish$(topic: string, payload: any, opts: MqttPublishOptions = { qos: 0, retain: false }): Observable<MqttReturnData> {
    const publish$ = bindNodeCallback<string, string, MqttPublishOptions>(this.client.publish.bind(this.client));
    this.logger.info("MQTT publish", { topic, payload, ...opts });
    return publish$(topic, JSON.stringify(payload), opts).pipe(map(() => ({ topic, payload, opts })));
  }

  public publishRetain$(topic: string, payload: any): Observable<MqttReturnData> {
    const opts: IClientPublishOptions = { qos: 0, retain: true };
    this.logger.info("MQTT publish retain", { topic, payload, ...opts });
    const publish$ = bindNodeCallback<string, string, MqttPublishOptions>(this.client.publish.bind(this.client));
    return publish$(topic, JSON.stringify(payload), opts).pipe(map(() => ({ topic, payload, opts })));
  }

  public releaseRetain$(topic: string): Observable<MqttReturnData> {
    const payload = "";
    const opts: IClientPublishOptions = { qos: 0, retain: true };
    const publish$ = bindNodeCallback<string, string, MqttPublishOptions>(this.client.publish.bind(this.client));
    this.logger.info("MQTT release retain", { topic, payload, ...opts });
    return publish$(topic, payload, opts).pipe(map(() => ({ topic, payload, opts })));
  }
}
