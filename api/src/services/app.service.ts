import * as core from "express-serve-static-core";
import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import bodyParser from "body-parser";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { EventEmitter } from "events";
import fetch from "node-fetch";
import {Config} from "../util/secrets";
import {PostgresFactory} from "../db/storage/postgres/postgres.factory";
// import {RedisFactory}    from "../db/storage/redis.factory";
// import {MongodbFactory}  from "../db/storage/mongodb.factory";
import {
    LOGGER_SERVICE,
    CONFIG_SERVICE,
    // MONGODB_SERVICE,
    POSTGRES_SERVICE,
    // REDIS_PUB_SERVICE,
    // REDIS_SERVICE,
    // REDIS_SUB_SERVICE,
    APP_SERVICE,
    PROMETHEUS_SERVICE,
    EMITTER_SERVICE,
    ROLE_REPOSITORY_SERVICE,
    USER_REPOSITORY_SERVICE, ACCOUNT_REPOSITORY_SERVICE
} from "./constants";
import {Pool} from "pg";
import {RedisClientType, RedisModules, RedisScripts} from "redis";
import {Mongoose} from "mongoose";
import logger from "../util/logger";
import lusca from "lusca";
import errorHandler from "errorhandler";
import {apiRoutes} from "../routes/api.route";
import {getSwaggerOptions} from "./swagger.service";
import { Prometheus } from "../monitoring/prometheus";
import {RoleRepository} from "../db/storage/postgres/repository/role.repository";
import {UserRepository} from "../db/storage/postgres/repository/user.repository";
import {roleRoutes} from "../routes/role.route";
import {userRoutes} from "../routes/user.route";
import {authRoutes} from "../routes/auth.route";
import passport from "passport";
import session from "express-session";
import {UserEntity} from "../db/entities/users.entity";
import bcrypt from "bcrypt-nodejs";
import {AccountRepository} from "../db/storage/postgres/repository/account.repository";
import {IAccountServiceRepository} from "../db/interfaces/account.interface";
import {IUserServiceRepository} from "../db/interfaces/user.interface";
import {IRoleServiceRepository} from "../db/interfaces/role.interface";
import {accountRoutes} from "../routes/account.route";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LocalStrategy = require("passport-local").Strategy;

passport.serializeUser(function(user: UserEntity, done) {
    if (user && user.id) {
        done(null, user.id);
    } else {
        done(new Error("incorrect credentials"), null);
    }
});

passport.deserializeUser(async function(id, done){
    const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
    try {
        const user = await repository.getUserById(id as number);
        done(null, user);
    } catch (e) {
        done(e, null);
    }
});
/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy(
    {
        usernameField: "email"
    }, async (email: string, password: string, done: any) => {
        const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
        try {
            const user = await repository.getUserByEmail(email);
            if (user) {
                user.comparePassword(password, (err: Error, isMatch: boolean) => {
                    if (err) { return done(err); }
                    if (isMatch) {
                        return done(undefined, user);
                    }
                    return done(new Error("invalid email or password."), undefined);
                });
            }
            if (user === null) {
                throw new Error("no user found");
            }
        } catch (e) {
            done(e);
        }
    })
);


/**
 * Main Service Class
 */
export class Service {
    static service: {
        [name: string]: Config | Pool | RedisClientType<RedisModules, RedisScripts> | Mongoose | core.Express | Prometheus | EventEmitter |
            IRoleServiceRepository | IUserServiceRepository | IAccountServiceRepository |
            Promise<any> | any;
    };
    static fetchJSON (url: string, parameters: any = {}): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const response: any = await fetch(url, parameters).catch(e => reject(e));
                if (response) {
                    if (response.status === 200) {
                        return resolve(await response.json());
                    } else {
                        if (url === Service.getService<Config>(CONFIG_SERVICE).services.provider + "/api/v1/validate") {
                            return resolve(await response.text());
                        }
                        return reject(await response.json());
                    }
                }
                return reject(new Error(`${url} is not available`));
            } catch (e) {
                reject(e);
            }
        });
    }
    /**
     * generate password with bcrypt
     * @param password
     * @private
     */
    static hash(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(10, (e: Error, salt: string) => {
                if (e) {
                    reject(e);
                }
                bcrypt.hash(password, salt, undefined, (e: Error, hash: string) => {
                    if (e) {
                        reject(e);
                    }
                    resolve(hash);
                });
            });

        });
    }
    constructor() {
        (async () => {
            try {
            } catch (e) {
                throw e;
            }
        })();
    }

    bootstrap() {
        this.diSetup()
            .setup()
            .router()
            .swagger()
            .prometheus()
            .serve();
    }
    diSetup(): Service {
        const config     = new Config();
        const app        = express();
        const prometheus = new Prometheus();
        const pool       = PostgresFactory.createPoolFromEnv(config.connections.database.url);
        // const redis      = RedisFactory.createClientFromEnv(config.connections.redis);
        // const redisSub   = RedisFactory.duplicate(redis);
        // const redisPub   = RedisFactory.duplicate(redis);
        // const mongodb    = MongodbFactory.createConnectionFromEnv(config.connections.mongodb);
        const emitter    = new EventEmitter();
        Service.addService(LOGGER_SERVICE, logger);
        Service.addService(CONFIG_SERVICE, config);
        Service.addService(APP_SERVICE, app);
        Service.addService(PROMETHEUS_SERVICE, prometheus);
        Service.addService(POSTGRES_SERVICE, pool);
        // Service.addService(REDIS_SERVICE, redis);
        // Service.addService(REDIS_SUB_SERVICE, redisSub);
        // Service.addService(REDIS_PUB_SERVICE, redisPub);
        // Service.addService(MONGODB_SERVICE, mongodb);
        Service.addService(EMITTER_SERVICE, emitter);
        Service.addService(ROLE_REPOSITORY_SERVICE, new RoleRepository());
        Service.addService(USER_REPOSITORY_SERVICE, new UserRepository());
        Service.addService(ACCOUNT_REPOSITORY_SERVICE, new AccountRepository());
        // (async () => {
        //     try {
        //         await Promise.all([
        //             redis.connect(),
        //             redisPub.connect(),
        //             redisSub.connect(),
        //             // mongodb.connect
        //         ]);
        //     } catch(e) {
        //         return e;
        //     }
        // })().catch(e => emitter.emit("error", e));
        // emitter.emit("start", this);
        return this;
    }
    setup(): Service {
        const config = Service.getService<Config>(CONFIG_SERVICE);
        const app    = Service.getService<core.Express>(APP_SERVICE);
        logger.info(`configure express server on port ${config.app.port}`);
        app.set("port", config.app.port);
        app.use(cookieParser(config.app.secret));
        app.use(compression());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        const cookieExpirationDate = new Date();
        const cookieExpirationDays = 365;
        cookieExpirationDate.setDate(cookieExpirationDate.getDate() + cookieExpirationDays);
        app.use(session());
        app.use(passport.initialize());
        app.use(passport.session());
        app.set("trust proxy", 1);

        app.use(lusca.xframe("SAMEORIGIN"));
        app.use(lusca.xssProtection(true));

        /**
         * Error Handler. Provides full stack - remove for production
         */
        app.use(errorHandler());
        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "*");
            res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Methods, Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
        });

        /**
         * Default middleware
         */
        app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
            const emitter = Service.getService<EventEmitter>(EMITTER_SERVICE);
            emitter.emit("defaultMiddleware", {request, response});
            next();
        });
        return this;
    }
    router(): Service {
        const app = Service.getService<core.Express>(APP_SERVICE);
        logger.info("configure express server routes");
        app.use("/api/v1",         apiRoutes());
        app.use("/api/v1/auth",    authRoutes());
        app.use("/api/v1/role",    roleRoutes());
        app.use("/api/v1/user",    userRoutes());
        app.use("/api/v1/account", accountRoutes());
        return this;
    }
    swagger(): Service {
        const config = Service.getService<Config>(CONFIG_SERVICE);
        const app    = Service.getService<core.Express>(APP_SERVICE);
        logger.info("configure express server swagger");
        const swaggerDocs = swaggerJSDoc(getSwaggerOptions(config));
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
        return this;
    }
    prometheus(): Service {
        const app = Service.getService<core.Express>(APP_SERVICE);
        const prometheus = Service.getService<Prometheus>(PROMETHEUS_SERVICE);
        logger.info("configure express server metrics");
        prometheus.injectMetricsRoute(app);
        prometheus.startCollection();
        return this;
    }
    serve(): Service {
        const app = Service.getService<core.Express>(APP_SERVICE);
        logger.info(`starting express server on port ${app.get("port")}`);
        /**
         * Start Express server.
         */
        app.listen(app.get("port"), () => {
            logger.info(`app is running http://localhost:${app.get("port")} in ${app.get("env")} mode`);
        });
        return this;
    }

    // serveSocket() {
    //     logger.info(`configure websocket server on port ${Config.wss.port}`);
    //     const server = this.server;
    //     const wss = new WebSocket.Server({ server });
    //     wss.on("connection", (ws) => {
    //         this.logger.log("info", `open websocket connection ${Config.wss.port}`);
    //         ws.on("message", (token) => {
    //             this.wssMessage(ws, token);
    //         });
    //     });
    //     server.listen(Config.wss.port);
    //     this.server = server;
    //     this.wss = wss;
    //     return this;
    // }

    /**
     * Add services instance to container as singleton.
     *
     * @param name
     * @param service
     */
    public static addService<T extends Config | Pool | RedisClientType<RedisModules, RedisScripts> | Mongoose | core.Express |
        Prometheus | EventEmitter | IRoleServiceRepository | IUserServiceRepository | IAccountServiceRepository |
        Promise<any>>(name: string, service: T): void {
        if (!Service.service) {
            Service.service = {};
        }
        Service.service[name] = service;
    }

    /**
     * Get services instance from container.
     *
     * @param name
     */
    public static getService<T>(name: string): T {
        return Service.service[name];
    }
}