import express from "express";
import {RoleController} from "../controllers/dashboard/role.controller";

// Define routes /api/v1
const wrapper = () => {
    const router = express.Router();
    const controller = new RoleController();
    router.get("/",    controller.get);
    router.get("/:id", controller.getOne);
    router.put("/",    controller.update);
    router.post("/",   controller.create);
    router.delete("/", controller.delete);

    return router;
};
export const roleRoutes = wrapper;
