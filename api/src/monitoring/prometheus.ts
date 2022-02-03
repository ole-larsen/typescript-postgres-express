import client from "prom-client";
const register = client.register;

import express from "express";
import * as core from "express-serve-static-core";
import logger from "../util/logger";

export class Prometheus {
    static httpRequestTimer = new client.Histogram({
        name: "http_request_duration_seconds",
        help: "Duration of HTTP requests in seconds",
        labelNames: ["method", "route", "code"],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 0.1 to 10 seconds
    });

    /**
     * This function will start the collection of metrics and should be called from within in the main js file
     */
    startCollection = function () {
        if (process.env.NODE_ENV !== "test") {
            logger.info("starting the collection of metrics, the metrics are available on /metrics");
        }
        const collectDefaultMetrics = client.collectDefaultMetrics;
        // const gcDurationBuckets = [0.1, 0.2, 0.3];
        // collectDefaultMetrics({ gcDurationBuckets });
        collectDefaultMetrics();
        return this;
    };

    /**
     * In order to have Prometheus get the data from this app a specific URL is registered
     */
    injectMetricsRoute = function (app: core.Express) {
        app.get("/metrics", (req: express.Request, res: express.Response) => {
            // Start the HTTP request timer, saving a reference to the returned method
            // const end = Prometheus.httpRequestTimer.startTimer();
            // Save reference to the path so we can record it when ending the timer
            // const route = req.route.path;
            res.set("Content-Type", register.contentType);
            res.send(register.metrics());
            // End timer and add labels
            // end({ route, code: res.statusCode, method: req.method });
        });
        return this;
    };
}
