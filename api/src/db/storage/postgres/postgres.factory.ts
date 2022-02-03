import {Pool, PoolClient, QueryResult} from "pg";
import logger from "../../../util/logger";
import {response} from "express";

/**
 * PostgreSQL Factory.
 */
export class PostgresFactory {
    /**
     * Create PostgreSQL pool of connections with options from environment variables.
     */
    public static createPoolFromEnv(connectionString: string): Pool {
        return new Pool({
            connectionString: connectionString
        });
    }

}
