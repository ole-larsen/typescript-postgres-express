import { Service } from "./services/app.service";
import { APP_SERVICE, EMITTER_SERVICE } from "./services/constants";
import * as core from "express-serve-static-core";
import { EventEmitter } from "events";

import express from "express";
import logger from "./util/logger";
import {RoleEntity} from "./infrastructure/entities/roles.entity";

// 1. Create new services
// 2. Connect services to mongodb
// 3. Connect services to redis
// 4. setup app from services
// 5. config routes for app
// 6. serve app
// 7. run cron for collect data
// 8. run socket server

const service: Service = new Service();
service.bootstrap();
const emitter = Service.getService<EventEmitter>(EMITTER_SERVICE);
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
    logger.info(log);
});

// 1.
// emitter.on("auth.check", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.message) {
//             logger.error(`auth check: ${message.message}`);
//         } else {
//             logger.warn(message);
//         }
//     }
// });
// emitter.on("auth.login", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.user) {
//             logger.info(`successfully logged in: ${message.username} ${message.email} ${message.enabled ? "enabled" : "disabled"}`);
//         } else {
//             if (message.headers) {
//                 logger.warn(message.originalUrl);
//                 logger.warn(message.rawHeaders);
//                 logger.warn(`request query: unauthorized ${JSON.stringify(message.query)}`);
//                 if (message.body.password) {
//                     delete message.body.password;
//                 }
//                 logger.warn(`request body: unauthorized ${JSON.stringify(message.body)}`);
//             } else {
//                 logger.warn(message);
//             }
//         }
//     }
// });
// emitter.on("auth.ga2fa", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.user) {
//             logger.info(`successfully logged in: ${message.username} ${message.email} ${message.enabled ? "enabled" : "disabled"}`);
//         } else {
//             if (message.headers) {
//                 logger.warn(message.originalUrl);
//                 logger.warn(message.rawHeaders);
//                 logger.warn(`request query: unauthorized ${JSON.stringify(message.query)}`);
//                 if (message.body.password) {
//                     delete message.body.password;
//                 }
//                 logger.warn(`request body: unauthorized ${JSON.stringify(message.body)}`);
//             } else {
//                 logger.error(message);
//             }
//         }
//     }
// });
//
// emitter.on("auth.signup", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.user) {
//             logger.info(`successfully signup in: ${message.username} ${message.email} ${message.enabled ? "enabled" : "disabled"}`);
//         } else {
//             if (message.message) {
//                 logger.error(message.message);
//             } else {
//                 logger.warn(message);
//             }
//         }
//     }
// });
// emitter.on("auth.callback", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.user) {
//             logger.info(`callback in: ${message.username} ${message.email} ${message.enabled ? "enabled" : "disabled"}`);
//         } else {
//             if (message.headers) {
//                 logger.warn(message.originalUrl);
//                 logger.warn(message.rawHeaders);
//                 logger.warn(`request query: callback ${JSON.stringify(message.query)}`);
//                 if (message.body.password) {
//                     delete message.body.password;
//                 }
//                 logger.warn(`request body: callback ${JSON.stringify(message.body)}`);
//             } else {
//                 logger.warn(message);
//             }
//         }
//     }
// });
// emitter.on("auth.logout", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.message) {
//             logger.error(`logout error: ${message.message}`);
//         } else {
//             logger.warn(message);
//         }
//     }
// });
// emitter.on("auth.forgot", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.message) {
//             logger.error(`forgot password error: ${message.message}`);
//         } else {
//             logger.warn(message);
//         }
//     }
// });
// emitter.on("auth.reset", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.message) {
//             logger.error(`reset password error: ${message.message}`);
//         } else {
//             logger.warn(message);
//         }
//     }
// });
//
// emitter.on("config", (message) => {
//     logger.error(message);
// });
// emitter.on("provider", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.user) {
//             logger.info(`users.validate:successfull: ${message.user.id} ${message.user.email}`);
//         } else {
//             logger.warn(message);
//         }
//     }
// });
//
// emitter.on("user", (message) => {
//     if (typeof message === "string") {
//         logger.error(message.replace("\n", ""));
//     } else {
//         if (message.message) {
//             logger.error(`user error: ${message.message}`);
//         } else {
//             logger.warn(message);
//         }
//     }
// });
//
// emitter.on("error", (e) => {
//     logger.error(e);
// });
// emitter.on("success", (count) => {
//     console.log(`Count is: ${count}`);
// });
// emitter.on("role", (message) => {
//     if (message.roles) {
//         logger.info(message.roles.map((role: RoleEntity) => role.title));
//     } else
//     if (message.role) {
//         logger.info(message.role);
//     } else
//     if (message.message) {
//         logger.error(message.message);
//     }
//     else {
//         logger.error(message);
//     }
// });
//
// emitter.on("end", () => {
//     console.info("Counter has ended");
// });
const app = Service.getService<core.Express>(APP_SERVICE);
export default app;
