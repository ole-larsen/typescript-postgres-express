import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";
import {RedisClientOptions, RedisModules, RedisScripts} from "redis";

if (fs.existsSync(".env")) {
    if (process.env.NODE_ENV !== "test") {
        logger.debug("Using .env file to supply config environment variables");
    }
    dotenv.config({ path: ".env" });
} else {
    if (process.env.NODE_ENV !== "test") {
        logger.debug("Using .env.example file to supply config environment variables");
    }
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
        redis?:   RedisClientOptions<RedisModules, RedisScripts>;
        mongodb?: string;
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
    constructor () {
        const databaseConfig = {
             url: process.env.NODE_ENV === "test"
                ? process.env.TEST_DATABASE_URL
                : process.env.DATABASE_URL,
            port: process.env.NODE_ENV === "test"
                ? process.env.TEST_DATABASE_PORT
                : process.env.DATABASE_PORT,
        };

        this.connections = {
            database: databaseConfig,
            // redis:    redisConfig,
            // mongodb:  mongodbConfig
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

        this.testUser = {
            username: process.env["TEST_USER_USERNAME"],
            email:    process.env["TEST_USER_EMAIL"],
            password: process.env["TEST_USER_PASSWORD"],
            secret:   process.env["TEST_USER_SECRET"],
            code:     process.env["TEST_USER_2FA_CODE"]
        };

        this.services = {
          provider: process.env["PROVIDER_URL"]
        };
    }
}