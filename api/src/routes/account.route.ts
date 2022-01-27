import express from "express";
import {AccountController} from "../controllers/dashboard/account.controller";

// Define routes /api/v1
const wrapper = () => {
    const router = express.Router();
    const controller = new AccountController();
    router.get("/",    controller.get);
    router.get("/:id", controller.getOne);
    router.put("/",    controller.update);
    router.post("/",   controller.create);
    router.delete("/", controller.delete);

    return router;
};
export const accountRoutes = wrapper;
