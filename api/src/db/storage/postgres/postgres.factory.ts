import {Pool, PoolClient} from "pg";
import logger from "../../../util/logger";

/**
 * PostgreSQL Factory.
 */
export class PostgresFactory {
  /**
   * Create PostgreSQL pool of connections with options from environment variables.
   */
  public static createPoolFromEnv(connectionString: string): Pool {
    const pool = new Pool({
      connectionString: connectionString,
    });
    // the pool will emit an error on behalf of any idle clients it contains if a backend error or network partition happens
    pool.on("error", (e: Error, client: PoolClient) => {
      logger.error(e.message);
      process.exit(-1);
    });
    // async/await - check out a client
    (async () => {
      const client = await pool.connect();
      try {
        logger.info("postgres ready");
      } catch (e) {
        throw e;
      } finally {
        // Make sure to release the client before any error handling,
        // just in case the error handling itself throws an error.
        client.release();
        logger.info("postgres disconnected");
      }
    })().catch(err => logger.error(err.stack));
    return pool;
  }
}
