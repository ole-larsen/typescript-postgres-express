import express from "express";
import {UsersController} from "./users.controller";
import dtoValidatorMiddleware from "../infrastructure/middleware/dto.validator";
import {UserCreateDto} from "./dto/user.create.dto";
import {UserUpdateDto} from "./dto/user.update.dto";
import {UserDeleteDto} from "./dto/user.delete.dto";

// Define routes /api/v1
const wrapper = (): express.Router => {
    const router = express.Router();
    const controller = new UsersController();

    router.get("/",       controller.get);
    router.get("/:id",    controller.getOne);
    router.post("/",      dtoValidatorMiddleware(UserCreateDto), controller.create);
    router.patch("/",     dtoValidatorMiddleware(UserUpdateDto), controller.update);
    router.delete("/",    dtoValidatorMiddleware(UserDeleteDto), controller.delete);

    return router;
};
export const userRoutes = wrapper;
