import express from "express";
import {AuthController} from "../controllers/auth/auth.controller";
import {UserController} from "../controllers/dashboard/user.controller";

// Define routes /api/v1
const wrapper = () => {
    const router = express.Router();
    const controller = new AuthController();
    const userController = new UserController();
    router.get("/",                 controller.get);
    router.get("/callback",         controller.callback);
    router.post("/check",           controller.check);
    router.post("/signin",          controller.login);
    router.post("/2fa",             controller.ga2fa);
    router.post("/signup",          controller.signup);
    router.post("/logout",          controller.logout);
    router.post("/forgot-password", controller.forgot);
    router.post("/reset/:token",    controller.reset);
    router.delete("/",              userController.delete);
    return router;
};
export const authRoutes = wrapper;
