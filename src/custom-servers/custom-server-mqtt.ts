import { MessageHandler } from "@nestjs/microservices/interfaces";

import { ServerMqtt } from "@nestjs/microservices/server";

// ---------------------------------------------------

export const MQTT_SEPARATOR = "/";
export const MQTT_WILDCARD_ALL = "#";
export const MQTT_WILDCARD_SINGLE = "+";

export class CustomServerMqtt extends ServerMqtt {
  public matchMqttPattern(pattern: string, topic: string): boolean {
    const patternSegments = pattern.split(MQTT_SEPARATOR);
    const topicSegments = topic.split(MQTT_SEPARATOR);

    for (let i = 0; i < patternSegments.length; i++) {
      const currentPattern = patternSegments[i];
      const patternChar = currentPattern[0];
      const currentTopic = topicSegments[i];

      if (!currentTopic && !currentPattern) {
        continue;
      }
      if (!currentTopic && currentPattern !== MQTT_WILDCARD_ALL) {
        return false;
      }
      if (patternChar === MQTT_WILDCARD_ALL) {
        return i === patternSegments.length - 1;
      }
      if (patternChar !== MQTT_WILDCARD_SINGLE && currentPattern !== currentTopic) {
        return false;
      }
    }
    return patternSegments.length === topicSegments.length;
  }

  public getHandlerByPattern(key: string): MessageHandler | null {
    if (this.messageHandlers.has(key)) {
      return this.messageHandlers.get(key) as any;
    }

    for (const [pattern, value] of this.messageHandlers) {
      if (pattern.indexOf(MQTT_WILDCARD_SINGLE) === -1 && pattern.indexOf(MQTT_WILDCARD_ALL) === -1) {
        continue;
      }
      if (this.matchMqttPattern(pattern, key)) {
        return value;
      }
    }

    return null;
  }
}
