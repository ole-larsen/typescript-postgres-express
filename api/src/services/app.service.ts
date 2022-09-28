import * as core from "express-serve-static-core";
import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import bodyParser from "body-parser";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { EventEmitter } from "events";
import fetch from "node-fetch";
import {Config} from "../infrastructure/util/secrets";

import {
  CONFIG_SERVICE,
  POSTGRES_SERVICE,
  APP_SERVICE,
  PROMETHEUS_SERVICE,
  EMITTER_SERVICE,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
  ACCOUNT_REPOSITORY,
  SERVER_SERVICE,
  TASK_REPOSITORY,
  SCHEDULER_CLIENT,
  SCHEDULER_SERVICE,
  REDIS_SERVICE, SUBSCRIBE_CLIENT, LOGGER_SERVICE, TIMESERIES_REPOSITORY,
} from "./app.constants";

import logger, {Logger} from "../infrastructure/util/logger";
import lusca from "lusca";
import {apiRoutes} from "../api/api.route";
import {getSwaggerOptions} from "./swagger/swagger.service";
import { PrometheusService } from "./monitoring/prometheus.service";
import {RoleRepository} from "../roles/role.repository";
import {UserRepository} from "../users/user.repository";
import {roleRoutes} from "../roles/role.route";
import {userRoutes} from "../users/user.route";
import {authRoutes} from "../auth/auth.route";
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import {AccountRepository} from "../accounts/account.repository";
import {IAccountServiceRepository} from "../infrastructure/database/postgres/interface/account.repository.interface";
import {IUserServiceRepository} from "../infrastructure/database/postgres/interface/user.repository.interface";
import {IRoleServiceRepository} from "../infrastructure/database/postgres/interface/role.repository.interface";
import {accountRoutes} from "../accounts/account.route";

import {ITaskServiceRepository} from "../infrastructure/database/postgres/interface/task.repository.interface";
import {ITaskClient} from "./http/interfaces/task.client.interface";
import {HttpService} from "./http/http.service";
import {ISubscribeServiceInterface} from "./subscribe/interfaces/subscribe.interface";
import {SubscribeNatsService} from "./subscribe/subscribe.nats.service";
import {IRedisFactory, RedisFactory} from "../infrastructure/database/redis/factory/redis.factory";
import {TaskService} from "./schedulers/task.service";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {TaskRepository} from "../tasks/task.repository";
import {IPostgresFactory} from "../infrastructure/database/postgres/factory/postgres.factory.interface";
import {PostgresFactory} from "../infrastructure/database/postgres/factory/postgres.factory";
import {TaskClient} from "./http/client/task.client";
import {taskRoutes} from "../tasks/task.route";
import {HttpException} from "../infrastructure/exception/http.exception";
import {TimeSeriesRepository} from "../timeseries/timeseries.repository";
import {ITimeSeriesServiceRepository} from "../infrastructure/database/postgres/interface/timeseries.repository.interface";
import {timeSeriesRoutes} from "../timeseries/timeseries.route";
import {MetricsSchedulerService} from "./schedulers/metrics.scheduler.service";

export class Service {
  static schedulers: {
    [name: string]: {
      [name: string]: MetricsSchedulerService
    }
  }
  static service: {
    [name: string]:
      Logger |
      Config |
      IPostgresFactory |
      IRedisFactory |
      core.Express |
      PrometheusService |
      EventEmitter |
      HttpService;
  };

  static repository: {
    [name: string]:
      IRoleServiceRepository |
      IUserServiceRepository |
      IAccountServiceRepository |
      ITaskServiceRepository |
      ITimeSeriesServiceRepository;
  };

  static client: {
    [name: string]: ITaskClient | ISubscribeServiceInterface;
  };

  static fetchJSON (url: string, parameters: any = {}): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(url, parameters).catch(e => reject(e));
        if (response) {
          if (response.status !== 200) {
            const text = await response.clone().text();
            if (url === Service.getService<Config>(CONFIG_SERVICE).services.provider + "/api/v1/validate") {
              return resolve(text);
            } else {
              return reject(text);
            }
          } else {
            try {
              return resolve(await response.json());
            } catch (e) {
              return reject(await response.clone().text());
            }
          }
        }
        return reject(new Error(`${url} is not available`));
      } catch (e) {
        reject(e);
      }
    });
  }

  static hash(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const saltRounds = 10;
      if (password) {
        bcrypt.hash(password.toString(), saltRounds, function(e: Error, hash: string) {
          if (e) {
            reject(e);
          }
          resolve(hash);
        });
      }
    });
  }

  /**
   * Add services instance to container as singleton.
   *
   * @param name
   * @param service
   */
  static addService<T extends
    Logger |
    Config |
    IPostgresFactory |
    IRedisFactory |
    core.Express |
    PrometheusService |
    EventEmitter | HttpService>(name: string, service: T): void {
    if (!Service.service) {
      Service.service = {};
    }
    Service.service[name] = service as T;
  }

  static getService<T extends
    Logger |
    Config |
    IPostgresFactory |
    IRedisFactory |
    core.Express |
    PrometheusService |
    EventEmitter | HttpService>(name: string): T {
    if (!Service.service) {
      return undefined;
    }
    return Service.service[name] as T;
  }

  static addClient<T extends ITaskClient | ISubscribeServiceInterface>(name: string, client: T): void {
    if (!Service.client) {
      Service.client = {};
    }
    Service.client[name] = client as T;
  }

  static getClient<T extends ITaskClient | ISubscribeServiceInterface>(name: string): T {
    return Service.client[name] as T;
  }

  static addRepository<T extends
      IRoleServiceRepository |
    IUserServiceRepository |
    IAccountServiceRepository |
    ITaskServiceRepository |
    ITimeSeriesServiceRepository>(name: string, repository: T): void {
    if (!Service.repository) {
      Service.repository = {};
    }
    Service.repository[name] = repository as T;
  }

  static getRepository<T extends
      IRoleServiceRepository |
    IUserServiceRepository |
    IAccountServiceRepository |
    ITaskServiceRepository |
    ITimeSeriesServiceRepository>(name: string): T {
    return Service.repository[name] as T;
  }

  static addScheduler<T extends
    MetricsSchedulerService>(name: string, identity: string, service: T): void {
    if (!Service.schedulers) {
      Service.schedulers = {};
    }
    if (!Service.schedulers[identity]) {
      Service.schedulers[identity] = {};
    }
    Service.schedulers[identity][name] = service as T;
  }

  static deleteScheduler<T extends
    MetricsSchedulerService>(name: string, identity: string): void {
    if (!Service.schedulers) {
      return;
    }
    if (!Service.schedulers[identity]) {
      return;
    }
    delete Service.schedulers[identity][name];
  }


  static getScheduler<T extends
    MetricsSchedulerService>(name: string, identity: string): T {
    if (!Service.schedulers) {
      return undefined;
    }
    if (!Service.schedulers[identity]) {
      return undefined;
    }
    return Service.schedulers[identity][name] as T;
  }

  bootstrap(): Service {
    this.diSetup()
      .redis(false)
      .express()
      .router()
      .logger()
      .swagger()
      .prometheus()
      .serve()
      .scheduler(true);
    return this;
  }

  redis(isEnabled: boolean = false): Service {
    if (!isEnabled) {
      return this;
    }
    const config  = Service.getService<Config>(CONFIG_SERVICE);
    const redis = RedisFactory.createClientFromEnv(config.connections.redis);
    const logger = Service.getService<Logger>(LOGGER_SERVICE);

    Service.addService(REDIS_SERVICE, redis);

    redis
      .connect()
      .then(async () => {
        logger.info("connected", { service: "redis" });
        if (process.env.NODE_ENV === "test") {
          await redis.disconnect();
        }
      })
      .catch(e => {
        logger.error(e, { service: "redis" });
      });

    return this;
  }

  logger(): Service {
    const emitter = Service.getService<EventEmitter>(EMITTER_SERVICE);
    const logger = Service.getService<Logger>(LOGGER_SERVICE);
    if (emitter) {
      emitter.on("config", (message, config) => {
        logger[config as "debug" || "warn" || "info"](`config: ${message}`);
      });
      emitter.on("app", (message) => {
        logger.debug(`app: ${message}`);
      });
      emitter.on("scheduler", (message) => {
        logger.info(`scheduler: ${message}`);
      });
      emitter.on("nats", (message) => {
        logger.info(`nats: ${message}`);
      });
      emitter.on("redis", (message) => {
        logger.info(`redis: ${message}`);
      });

      emitter.on("accountController", (message) => {
        logger.info(`accountController: ${message}`);
      });

      emitter.on("roleController", (message) => {
        logger.info(`roleController: ${message}`);
      });

      emitter.on("userController", (message) => {
        logger.info(`userController: ${message}`);
      });

      emitter.on("authController", (message) => {
        logger.info(`authController: ${message}`);
      });

      emitter.on("loggerMiddleware", (provider) => {
        const request: express.Request = provider.request;
        const response: express.Response = provider.response;
        logger.warn( {
          label: "Request Body & Parameters",
          body: request.body,
          params: request.params,
          status: response.status
        });
      });

      emitter.on("defaultMiddleware", (provider) => {
        const request: express.Request = provider.request;
        const response: express.Response = provider.response;
        const getActualRequestDurationInMilliseconds = (start: [number, number]) => {
          const NS_PER_SEC = 1e9; // convert to nanoseconds
          const NS_TO_MS = 1e6; // convert to milliseconds
          const diff = process.hrtime(start);
          return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
        };
        const start = process.hrtime();
        const durationInMilliseconds = getActualRequestDurationInMilliseconds(start);
        const { httpVersion, method, socket, url } = request;
        const { remoteAddress } = socket;

        const { statusCode } = response;
        const log = `[Http:${httpVersion} address: ${remoteAddress} ${method}:${url} ${statusCode} ${durationInMilliseconds.toLocaleString()} ms`;
        emitter.emit("app", log);
      });

      emitter.on("corsMiddleware", (provider) => {
        const request: express.Request = provider.request;
        const response: express.Response = provider.response;
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Methods", "*");
        response.header("Access-Control-Allow-Headers", "Access-Control-Allow-Methods, Origin, X-Requested-With, Content-Type, Accept, Authorization");
        const { httpVersion, method, socket, url } = request;
        const { remoteAddress } = socket;

        const { statusCode } = response;
        const log = `[Http:${httpVersion} address: ${remoteAddress} ${method}:${url} ${statusCode} cors provided`;
        emitter.emit("app", log);
      });

      emitter.on("requestMiddleware", (provider) => {
        const request: express.Request = provider.request;
        const response: express.Response = provider.response;
        const { httpVersion, method, socket, url } = request;
        const { remoteAddress } = socket;

        const { statusCode } = response;
        const log = `[Http:${httpVersion} address: ${remoteAddress} ${method}:${url} ${statusCode}`;
        emitter.emit("app", log);
      });
    }
    return this;
  }

  diSetup(): Service {
    const emitter = new EventEmitter();

    if (!Service.getService<EventEmitter>(EMITTER_SERVICE)) {
      Service.addService(EMITTER_SERVICE, emitter);
    }

    if (!Service.getService<Logger>(LOGGER_SERVICE)) {
      Service.addService(LOGGER_SERVICE, logger);
    }

    if (!Service.getService<Config>(CONFIG_SERVICE)) {
      const config = new Config();
      Service.addService(CONFIG_SERVICE, config);
    }

    if (!Service.getService<IPostgresFactory>(POSTGRES_SERVICE)) {
      const config = Service.getService<Config>(CONFIG_SERVICE);
      const db = PostgresFactory.SetupRDBMS(config.connections.database.url);
      Service.addService(POSTGRES_SERVICE, db);
    }

    if (!Service.getService<core.Express>(APP_SERVICE)) {
      const app = express();
      Service.addService(APP_SERVICE, app);
    }

    Service.addRepository(ROLE_REPOSITORY, new RoleRepository());
    Service.addRepository(USER_REPOSITORY, new UserRepository());
    Service.addRepository(ACCOUNT_REPOSITORY, new AccountRepository());
    Service.addRepository(TASK_REPOSITORY, new TaskRepository());
    Service.addRepository(TIMESERIES_REPOSITORY, new TimeSeriesRepository());

    Service.addClient(SCHEDULER_CLIENT, new TaskClient());
    Service.addClient(SUBSCRIBE_CLIENT, new SubscribeNatsService());

    Service.addService(SCHEDULER_SERVICE, new HttpService());

    return this;
  }

  express(): Service {
    const app     = Service.getService<core.Express>(APP_SERVICE);
    const emitter = Service.getService<EventEmitter>(EMITTER_SERVICE);
    const config  = Service.getService<Config>(CONFIG_SERVICE);

    const cookieExpirationDate = new Date();
    const cookieExpirationDays = 365;

    cookieExpirationDate.setDate(cookieExpirationDate.getDate() + cookieExpirationDays);

    app.set("port", config.app.port);
    app.use(cookieParser(config.app.secret));
    app.use(compression());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(session({
      secret: config.app.secret,
      resave: true,
      saveUninitialized: true
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    app.set("trust proxy", 1);

    app.use(lusca.xframe("SAMEORIGIN"));
    app.use(lusca.xssProtection(true));

    app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
      emitter.emit("corsMiddleware", {request, response});
      next();
    });

    app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
      emitter.emit("defaultMiddleware", {request, response});
      next();
    });

    app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
      emitter.emit("requestMiddleware", {request, response});
      next();
    });

    app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
      emitter.emit("loggerMiddleware", {request, response});
      next();
    });

    return this;
  }

  router(): Service {
    const app = Service.getService<core.Express>(APP_SERVICE);

    app.use("/api/v1",                     apiRoutes());
    app.use("/api/v1/auth",                authRoutes());
    app.use("/api/v1/role",                roleRoutes());
    app.use("/api/v1/user",                userRoutes());
    app.use("/api/v1/account",             accountRoutes());
    app.use("/api/v1/task",                taskRoutes());
    app.use("/api/v1/timeseries",          timeSeriesRoutes());

    app.use("*", (request: express.Request, response: express.Response) => {
      response.status(HttpStatus.NOT_FOUND).send(HttpExceptionMessages.ROUTE_NOT_FOUND);
    });

    app.use((e: Error, request: express.Request, response: express.Response, next: express.NextFunction) => {
      if (e instanceof HttpException) {
        return response.status(e.statusCode).json({message: e.message});
      } else {
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: e.message});
      }
      next();
    });

    return this;
  }

  swagger(): Service {
    const app = Service.getService<core.Express>(APP_SERVICE);
    const config = Service.getService<Config>(CONFIG_SERVICE);
    const swaggerDocs = swaggerJSDoc(getSwaggerOptions(config));

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

    return this;
  }

  prometheus(): Service {
    const app = Service.getService<core.Express>(APP_SERVICE);
    const prometheus = new PrometheusService();

    if (!Service.getService<PrometheusService>(PROMETHEUS_SERVICE)) {
      Service.addService(PROMETHEUS_SERVICE, prometheus);
    }
    prometheus.injectMetricsRoute(app);
    prometheus.startCollection();

    return this;
  }

  serve(): Service {

    const app = Service.getService<core.Express>(APP_SERVICE);
    const logger = Service.getService<Logger>(LOGGER_SERVICE);

    const server = app.listen(app.get("port"), () => {
      logger.debug(`app: is running http://localhost:${app.get("port")} in ${app.get("env")} mode`, "info");
    });

    Service.addService(SERVER_SERVICE, server);

    logger.debug(`services initialized: ${Object.keys(Service.service).join(", ")}`, { service: "app" });
    logger.debug(`repositories initialized: ${Object.keys(Service.repository).join(", ")}`, { service: "app" });
    logger.debug(`clients initialized: ${Object.keys(Service.client).join(", ")}`, { service: "app" });

    return this;
  }

  scheduler(enabled: boolean): Service {
    if (process.env.NODE_ENV === "test" || enabled === false) {
      return this;
    }
    new TaskService();
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
}