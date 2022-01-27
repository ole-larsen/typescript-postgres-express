import { Service } from "./services/app.service";
import { APP_SERVICE, EMITTER_SERVICE } from "./services/constants";
import * as core from "express-serve-static-core";
import { EventEmitter } from "events";

import express from "express";
import logger from "./util/logger";

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

const app = Service.getService<core.Express>(APP_SERVICE);
export default app;
