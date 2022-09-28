import express from "express";
import {ApiController} from "./api.controller";

// Define routes /api/v1
const wrapper = (): express.Router => {
    const controller = new ApiController();
    const router = express.Router();

    router.get("/", controller.get);

    return router;
};

export const apiRoutes = wrapper;
