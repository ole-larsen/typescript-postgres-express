import {Service} from "../../../../api/src/services/app.service";
import {Config} from "../../../../api/src/util/secrets";
import {
    APP_SERVICE, CONFIG_SERVICE,
    SERVER_SERVICE, USER_REPOSITORY_SERVICE,
} from "../../../../api/src/services/app.constants";
import * as core from "express-serve-static-core";
import request from "supertest";
import http from "http";
import {ERROR_AUTH_USERNAME} from "../../../../api/src/controllers/auth/auth.error.codes";
import {UserRepository} from "../../../../api/src/db/storage/postgres/repository/user.repository";

describe("Service test api/src/routes/auth.route", () => {
    jest.setTimeout(60000);
    const service = new Service();
    beforeAll( () => {
        service.bootstrap();
    });
    afterAll(async () => {
        await Service.getService<http.Server>(SERVER_SERVICE).close();
        await new Promise(resolve => setTimeout(() => resolve({}), 30000));
    });
    it("1    GET  /api/v1/auth                 should return 200 OK", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).get("/api/v1/auth")
            .expect(200, done);
    });
    it("2    GET  /api/v1/auth/callback        should return 200 OK", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).get("/api/v1/auth/callback")
            .expect(200, done);
    });
    it("3    POST /api/v1/auth/check           should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/check")
            .expect(401, done);
    });
    it("4    POST /api/v1/auth/signup          should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/signup")
            .expect(401, done);
    });
    it("5    POST /api/v1/auth/2fa             should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/2fa")
            .end((err, res) => {
                expect(err).toBe(null);
                expect(res.body.message === "2FA code is incorrect").toBe(true);
                done();
            });
    });
    it("6    POST /api/v1/auth/logout          should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/logout")
            .expect(401, done);
    });
    it("7    POST /api/v1/auth/forgot-password should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/forgot-password")
            .expect(401, done);
    });
    it("8    POST /api/v1/auth/reset/:token    should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/reset/:token")
            .expect(401, done);
    });
    it("9    DELETE /api/v1/auth/              should return 400 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/auth/")
            .expect(400, done);
    });
    it("10   DELETE /api/v1/auth/              should return 200 with parameters", async () => {
        try {
            const config = Service.getService<Config>(CONFIG_SERVICE);
            const testUser = config.testUser;
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            const user = await repository
                .getByUsername(testUser.username);
            if (user) {
                expect(user.username === testUser.username).toBe(true);
                request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/auth/")
                    .send({
                        id: user.id
                    })
                    .end((err, res) => {
                        expect(err).toBe(null);
                        expect(res.body.user.removed).toBe(true);
                    });
            } else {
                expect(user).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
    it("11   POST /api/v1/auth/signup          should return error if password not matchs", (done) => {
        const config = Service.getService<Config>(CONFIG_SERVICE);
        const user = config.testUser;
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/signup")
            .send({
                username: user.username,
                email: user.email,
                password: user.password
            })
            .end((err, res) => {
                expect(res.body.message).toBe("password is not match");
                done();
            });
    });
    it("12   POST /api/v1/auth/signup          should return new user with parameters", (done) => {
        const config = Service.getService<Config>(CONFIG_SERVICE);
        const user = config.testUser;
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/signup")
            .send({
                username: user.username,
                email: user.email,
                password: user.password,
                confirm:  user.password
            })
            .end((err, res) => {
                if (res.body.message) {
                    // already registered
                    expect(res.body.message).toBe(user.username + " " + ERROR_AUTH_USERNAME);
                    done();
                } else {
                    expect(res.body.user).not.toBe(undefined);
                    expect(res.body.user.removed).toBe(false);
                    expect(res.body.user.username === user.username).toBe(true);
                    done();
                }
            });
    });
    it("13   POST /api/v1/auth/signin          for test user should return undefined", (done) => {
        const config = Service.getService<Config>(CONFIG_SERVICE);
        const user = config.testUser;
        request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/signin")
            .send({
                email: user.email,
                password: user.password
            })
            .end((err, res) => {
                expect(res.body.user.username).toBe(config.testUser.username);
                expect(res.body.user.email).toBe(config.testUser.email);
                done();
            });
    });
    it("14   POST /api/v1/auth/2fa             should return 200 with parameters", async () => {
        try {
            const config = Service.getService<Config>(CONFIG_SERVICE);
            const testUser = config.testUser;
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            const user = await repository
                .getByUsername(testUser.username);
            if (user) {
                expect(user.username === testUser.username).toBe(true);
                request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/2fa")
                    .send({
                        id: user.id
                    })
                    .end((err, res) => {
                        if (res.body.secret) {
                            expect(!!res.body.secret).toBe(true);
                            expect(!!res.body.qr).toBe(true);
                        }
                        if (res.body.message) {
                            console.log(res.body);
                            expect(res.body.message === "no 2FA code was provided").toBe(true);
                        }
                        expect(err).toBe(null);
                    });
            } else {
                expect(user).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
    it("18   POST /api/v1/auth/2fa             should return 200 with code", async () => {
        try {
            const config = Service.getService<Config>(CONFIG_SERVICE);
            const testUser = config.testUser;
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            const user = await repository
                .getByUsername(testUser.username);
            if (user) {
                expect(user.username === testUser.username).toBe(true);
                request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/auth/2fa")
                    .send({
                        id: user.id,
                        code: testUser.code
                    })
                    .end(async (err, res) => {
                        if (res.body.data) {
                            expect(!!res.body.data.access_token).toBe(true);
                            expect(!!res.body.data.expires_in).toBe(true);
                            expect(!!res.body.data.refresh_token).toBe(true);
                            expect(!!res.body.data.scope).toBe(true);
                            expect(!!res.body.data.token_type).toBe(true);
                        } else {
                            expect(res.body.message === "2FA code is incorrect").toBe(true);
                        }
                        expect(err).toBe(null);
                    });
            } else {
                expect(user).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
});