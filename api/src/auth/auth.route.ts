import express from "express";
import {AuthController} from "./auth.controller";
import {UsersController} from "../users/users.controller";
import dtoValidatorMiddleware from "../infrastructure/middleware/dto.validator";

import {AuthLoginDto} from "./dto/auth.login.dto";
import {AuthSignupDto} from "./dto/auth.signup.dto";
import {Auth2faDto} from "./dto/auth.2fa.dto";
import {AuthForgotDto} from "./dto/auth.forgot.dto";

// Define routes /api/v1
const wrapper = (): express.Router => {
    const router = express.Router();
    const controller = new AuthController();
    const userController = new UsersController();

    router.get("/",                 controller.get);
    router.get("/callback",         controller.callback);
    router.post("/check",           controller.check);
    router.post("/login",           dtoValidatorMiddleware(AuthLoginDto),  controller.login);
    router.post("/signup",          dtoValidatorMiddleware(AuthSignupDto), controller.signup);
    router.post("/2fa",             dtoValidatorMiddleware(Auth2faDto),    controller.ga2fa);
    router.post("/logout",          controller.logout);
    router.post("/forgot-password", dtoValidatorMiddleware(AuthForgotDto), controller.forgot);
    router.post("/reset/:token",    controller.reset);
    router.delete("/",              userController.delete);

    return router;
};
export const authRoutes = wrapper;
