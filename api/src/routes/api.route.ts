import express from "express";
import {ApiController} from "../controllers/api.controller";

// Define routes /api/v1
const wrapper = () => {
    const router = express.Router();
    const controller = new ApiController();
    router.get("/", controller.get);

    return router;
};
export const apiRoutes = wrapper;
