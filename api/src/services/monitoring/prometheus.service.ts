import client from "prom-client";
const register = client.register;

import express from "express";
import * as core from "express-serve-static-core";

export class PrometheusService {
    static httpRequestTimer = new client.Histogram({
        name: "http_request_duration_seconds",
        help: "Duration of HTTP requests in seconds",
        labelNames: ["method", "route", "code"],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 0.1 to 10 seconds
    });

    startCollection = function (): PrometheusService {
        const collectDefaultMetrics = client.collectDefaultMetrics;
        collectDefaultMetrics();
        return this;
    };

    injectMetricsRoute = function (app: core.Express): PrometheusService {
        app.get("/metrics", (req: express.Request, res: express.Response) => {
            // Start the HTTP request timer, saving a reference to the returned method
            // const end = PrometheusService.httpRequestTimer.startTimer();
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
