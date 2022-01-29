import request from "supertest";
import app from "../api/src/app";
//     router.get("/",                 controller.get);
//     router.post("/check",           controller.check);
//     router.post("/signin",          controller.login);
//     router.post("/2fa",             controller.ga2fa);
//     router.get("/callback",         controller.callback);
//     router.post("/signup",          controller.signup);
//     router.post("/logout",          controller.logout);
//     router.post("/forgot-password", controller.forgot);
//     router.post("/reset/:token",    controller.reset);
describe("GET /api/v1/auth", () => {
    it("should return 200 OK", () => {
        return request(app).get("/api/v1/auth")
            .expect(200);
    });
});
