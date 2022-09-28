import dotenv from "dotenv";
import fs from "fs";
import {RedisClientOptions, RedisModules, RedisScripts} from "redis";
import {Service} from "../../services/app.service";
import {LOGGER_SERVICE} from "../../services/app.constants";
import {Logger} from "./logger";

export class Config {
    services: {
        [name: string]: string;
    }
    schedulers: {
        [name: string]: string;
    }
    connections: {
        database: {
            url: string;
            port: string;
        },
        redis?: RedisClientOptions<RedisModules, RedisScripts>;
        mongodb?: string;
        nats?: {
            url: string;
            token: string;
        }
    }
    app: {
        port:   string;
        secret: string;
        domain: string;
    }
    defaultUser: {
        username: string;
        email:    string;
        password: string;
    }
    testUser: {
        username: string;
        email:    string;
        password: string;
        secret:   string;
        code:     string;
    }
    constructor() {
        const logger = Service.getService<Logger>(LOGGER_SERVICE);

        if (fs.existsSync(".env")) {
            logger.debug("using .env file to supply config environment variables", { service: "config" });
            dotenv.config({ path: ".env" });
        } else {
            logger.warn("using .env.example file to supply config environment variables", { service: "config" });
            dotenv.config({ path: ".env.example" });
        }

        const databaseConfig = {
             url: process.env.NODE_ENV === "test"
                ? process.env.TEST_DATABASE_URL
                : process.env.DATABASE_URL,
            port: process.env.NODE_ENV === "test"
                ? process.env.TEST_DATABASE_PORT
                : process.env.DATABASE_PORT,
        };

        const redisConfig: RedisClientOptions<RedisModules, RedisScripts> = {
            url: process.env["REDIS_HOST"]
        };

        this.connections = {
            database: databaseConfig,
            nats: {
                url: process.env.NATS_URL,
                token: process.env.NATS_TOKEN
            },
            redis:    redisConfig,
        };

        this.app = {
            port:   process.env["SERVER_PORT"] || "3000",
            secret: process.env["SESSION_SECRET"],
            domain: process.env["SERVER_DOMAIN"] || "localhost"
        };

        this.defaultUser = {
            username: process.env["DEFAULT_USER_USERNAME"],
            email:    process.env["DEFAULT_USER_EMAIL"],
            password: process.env["DEFAULT_USER_PASSWORD"]
        };

        this.testUser = {
            username: process.env["TEST_USER_USERNAME"],
            email:    process.env["TEST_USER_EMAIL"],
            password: process.env["TEST_USER_PASSWORD"],
            secret:   process.env["TEST_USER_SECRET"],
            code:     process.env["TEST_USER_2FA_CODE"]
        };

        this.services = {
            scheduler: process.env["SCHEDULER_SERVICE"],
            provider: process.env["PROVIDER"]
        };
        this.schedulers = {};
    }
}