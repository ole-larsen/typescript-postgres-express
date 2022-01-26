import {createClient, RedisClientType, RedisScripts, RedisModules, RedisClientOptions} from "redis";
import logger from "../../util/logger";

/**
 * Redis Factory.
 */
export class RedisFactory {
    /**
     * Create Redis client with options from environment variables.
     */
    public static createClientFromEnv(clientOptions: RedisClientOptions<RedisModules, RedisScripts>): RedisClientType<RedisModules, RedisScripts> {
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

    /**
     * @param client
     */
    public static duplicate(client: RedisClientType<RedisModules, RedisScripts>): RedisClientType<RedisModules, RedisScripts> {
        return client.duplicate();
    }
}
