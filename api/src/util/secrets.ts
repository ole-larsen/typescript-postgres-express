import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";
import {RedisClientOptions, RedisModules, RedisScripts} from "redis";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
} else {
    logger.debug("Using .env.example file to supply config environment variables");
    dotenv.config({ path: ".env.example" });  // you can delete this after you create your own .env file!
}

export class Config {
    services: {
        [name: string]: string;
    }
    connections: {
        database: {
            url: string;
            port: string;
        },
        redis:   RedisClientOptions<RedisModules, RedisScripts>;
        mongodb: string;
    }
    app: {
        port:   string;
        secret: string;
        domain: string;
    }
    defaultUser: {
        username: string;
        email: string;
        password: string;
    }
    constructor () {
        const databaseConfig = {
            url: process.env.DATABASE_URL || "postgresql://service:service@postgres:5432/service",
            port: process.env.DATABASE_PORT || "5432",
        };
        const redisConfig: RedisClientOptions<RedisModules, RedisScripts> = {};
        redisConfig.url = process.env["REDIS_URL"] || "redis://redis";

        if (process.env["REDIS_USERNAME"] && process.env["REDIS_USERNAME"] !== "") {
            redisConfig.password = process.env["REDIS_PASSWORD"];
        }
        if (process.env["REDIS_PASSWORD"] && process.env["REDIS_PASSWORD"] !== "") {
           redisConfig.password = process.env["REDIS_PASSWORD"];
        }
        const mongodbConfig = process.env["MONGODB_URL"];

        this.connections = {
            database: databaseConfig,
            redis:    redisConfig,
            mongodb:  mongodbConfig
        };

        this.app = {
            port:   process.env["SERVER_PORT"],
            secret: process.env["SESSION_SECRET"],
            domain: process.env["SERVER_DOMAIN"]
        };

        this.defaultUser = {
            username: process.env["DEFAULT_USER_USERNAME"],
            email:    process.env["DEFAULT_USER_EMAIL"],
            password: process.env["DEFAULT_USER_PASSWORD"]
        };

        this.services = {
          provider: process.env["PROVIDER_URL"]
        };
    }
}