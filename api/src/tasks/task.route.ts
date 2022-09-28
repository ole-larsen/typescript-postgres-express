import express from "express";
import { TasksController } from "./tasks.controller";
import dtoValidatorMiddleware from "../infrastructure/middleware/dto.validator";
import { TaskCreateDto } from "./dto/task.create.dto";
import { TaskUpdateDto } from "./dto/task.update.dto";

// Define routes /api/v1
const wrapper = (): express.Router => {
    const router = express.Router();
    const controller = new TasksController();

    router.get("/",    controller.get);
    router.get("/:id", controller.getOne);
    router.post("/",   dtoValidatorMiddleware(TaskCreateDto), controller.create);
    router.patch("/",  dtoValidatorMiddleware(TaskUpdateDto), controller.update);
    router.delete("/", controller.delete);

    return router;
};

export const taskRoutes = wrapper;
