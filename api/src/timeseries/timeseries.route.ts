import express from "express";
import {TimeSeriesController} from "./timeseries.controller";

// Define routes /api/v1
const wrapper = (): express.Router => {
    const router = express.Router();
    const controller = new TimeSeriesController();

    router.get("/",       controller.get);

    return router;
};
export const timeSeriesRoutes = wrapper;
