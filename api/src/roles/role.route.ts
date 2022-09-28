import express from "express";
import {RolesController} from "./roles.controller";
import dtoValidatorMiddleware from "../infrastructure/middleware/dto.validator";

import {RoleCreateDto} from "./dto/role.create.dto";
import {RoleUpdateDto} from "./dto/role.update.dto";
import {RoleDeleteDto} from "./dto/role.delete.dto";

// Define routes /api/v1
const wrapper = (): express.Router => {
    const router = express.Router();
    const controller = new RolesController();

    router.get("/",       controller.get);
    router.get("/:id",    controller.getOne);
    router.post("/",      dtoValidatorMiddleware(RoleCreateDto), controller.create);
    router.patch("/",     dtoValidatorMiddleware(RoleUpdateDto), controller.update);
    router.delete("/",    dtoValidatorMiddleware(RoleDeleteDto), controller.delete);

    return router;
};
export const roleRoutes = wrapper;
