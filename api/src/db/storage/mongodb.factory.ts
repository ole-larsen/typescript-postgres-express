import mongoose, { Mongoose } from "mongoose";
import logger from "../../util/logger";

/**
 * Mongodb Factory.
 */
export class MongodbFactory {
    /**
     * Create Mongodb connections with options from environment variables.
     */
    public static createConnectionFromEnv(url: string): Mongoose {
        mongoose.connect(url).then((mongo: Mongoose) => {
            logger.info(`mongoose version ${mongo.version} is ready to use`);
        }).catch(e => {
            throw e;
        }).finally(() => {
            return mongoose;
        });
        return mongoose;
    }
}
