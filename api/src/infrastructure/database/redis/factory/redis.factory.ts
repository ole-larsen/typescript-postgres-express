import {createClient, RedisClientType, RedisScripts, RedisModules, RedisClientOptions} from "redis";
import logger from "../../../util/logger";

export type IRedisFactory = RedisClientType<RedisModules, RedisScripts>;

export class RedisFactory {
  public static createClientFromEnv(clientOptions: RedisClientOptions<RedisModules, RedisScripts>): IRedisFactory {
    const client = createClient(clientOptions);

    client.on("error", (e) => {
      logger.error("redis error", e);
    });
    client.on("ready", () => {
      logger.info("redis ready");
    });
    client.on("connection", () => {
      logger.info("redis is connected");
    });

    return client;
  }

  public static duplicate(client: RedisClientType<RedisModules, RedisScripts>): RedisClientType<RedisModules, RedisScripts> {
    return client.duplicate();
  }
}
