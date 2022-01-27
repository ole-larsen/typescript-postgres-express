import express from "express";
import {AuthController} from "../controllers/auth/auth.controller";

// Define routes /api/v1
const wrapper = () => {
    const router = express.Router();
    const controller = new AuthController();
    router.get("/",                 controller.get);
    router.post("/check",           controller.check);
    router.post("/signin",          controller.login);
    router.post("/2fa",             controller.ga2fa);
    router.get("/callback",         controller.callback);
    router.post("/signup",          controller.signup);
    router.post("/logout",          controller.logout);
    router.post("/forgot-password", controller.forgot);
    router.post("/reset/:token",    controller.reset);
    return router;
};
export const authRoutes = wrapper;
