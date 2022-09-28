import express from "express";
import {AccountsController} from "./accounts.controller";
import dtoMiddleware from "../infrastructure/middleware/dto.validator";
import {AccountCreateDto} from "./dto/account.create.dto";
import {AccountUpdateDto} from "./dto/account.update.dto";
import {AccountDeleteDto} from "./dto/account.delete.dto";

// Define routes /api/v1
const wrapper = (): express.Router => {
    const router = express.Router();
    const controller = new AccountsController();

    router.get("/",    controller.get);
    router.get("/:id", controller.getOne);
    router.post("/",   dtoMiddleware(AccountCreateDto), controller.create);
    router.patch("/",  dtoMiddleware(AccountUpdateDto), controller.update);
    router.delete("/", dtoMiddleware(AccountDeleteDto), controller.delete);

    return router;
};

export const accountRoutes = wrapper;
