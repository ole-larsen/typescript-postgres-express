import {Service} from "../../../../api/src/services/app.service";
import {
    APP_SERVICE, CONFIG_SERVICE,
    SERVER_SERVICE, USER_REPOSITORY_SERVICE,
} from "../../../../api/src/services/app.constants";
import * as core from "express-serve-static-core";
import request from "supertest";
import http from "http";
import {Config} from "../../../../api/src/util/secrets";
import {UserRepository} from "../../../../api/src/db/storage/postgres/repository/user.repository";

describe("Service test api/src/routes/user.route", () => {
    jest.setTimeout(30000);
    const service = new Service();
    beforeAll( () => {
        service.bootstrap();
    });
    afterAll(async () => {
        const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
        const config = Service.getService<Config>(CONFIG_SERVICE);
        const testUser = config.testUser;
        try {
            const user = await repository.getByUsername(testUser.username);
            if (user) {
                await repository.remove(user);
            }
        } catch (e) {
            console.log(e);
        }
        try {
            const updatedCreatedUser = await repository.getByUsername("updated_created_" + testUser.username);
            if (updatedCreatedUser) {
                await repository.remove(updatedCreatedUser);
            }
        } catch (e) {
            console.log(e);
        }
        try {
            const createdUser = await repository.getByUsername("created_" + testUser.username);
            if (createdUser) {
                await repository.remove(createdUser);
            }
        } catch (e) {
            console.log(e);
        }
        await Service.getService<http.Server>(SERVER_SERVICE).close();
        await new Promise(resolve => setTimeout(() => resolve({}), 10000));
    });
    it("1 GET /api/v1/user should return 200 OK", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).get("/api/v1/user")
            .expect(200, done);
    });
    // root should exist
    it("2 GET /api/v1/user/1 should return 200 OK", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).get("/api/v1/user/1")
            .expect(200, done);
    });
    // create
    it("4 POST /api/v1/user create should return 200 with parameters", async () => {
        try {
            const config = Service.getService<Config>(CONFIG_SERVICE);
            const testUser = config.testUser;
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            const user = await repository
                .getByUsername(testUser.username);
            if (user) {
                request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/user")
                    .send({
                        email: "created_" + testUser.email,
                        username: "created_" + testUser.username,
                        password: testUser.password,
                        confirm: testUser.password
                    })
                    .end(async (err, res) => {
                        expect(res.body.user.email === "created_" + testUser.email).toBe(true);
                        expect(res.body.user.username === "created_" + testUser.username).toBe(true);
                        expect(res.body.user.enabled).toBe(true);
                        // console.log(res.body.user.roles, res.body.user.roles.reduce((sum: number, current: number) => sum + current, 0));
                        expect(err).toBe(null);
                    });
            } else {
                expect(user).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
    // update
    it("3 PUT /api/v1/user update should return 200 with parameters", async () => {
        try {
            const config = Service.getService<Config>(CONFIG_SERVICE);
            const testUser = config.testUser;
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            const user = await repository
                .getByUsername("created_" + testUser.username);
            if (user) {
                request(Service.getService<core.Express>(APP_SERVICE)).put("/api/v1/user")
                    .send({
                        id: user.id,
                        email: "updated_" + user.email,
                        username: "updated_" + user.username,
                        enabled: !user.enabled,
                        secret: config.testUser.secret
                    })
                    .end(async (err, res) => {
                        expect(res.body.user.email === "updated_" + user.email).toBe(true);
                        expect(res.body.user.username === "updated_" + user.username).toBe(true);
                        expect(err).toBe(null);
                    });
            } else {
                expect(user).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });

    it("5 DELETE /api/v1/user/ updated_created_test user should return 200 with parameters", async () => {
        try {
            const config = Service.getService<Config>(CONFIG_SERVICE);
            const testUser = config.testUser;
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            const user = await repository
                .getByUsername("updated_created_" + testUser.username);
            if (user) {
                request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/user/")
                    .send({
                        id: user.id
                    })
                    .end((err, res) => {
                        console.log(res.body);
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
    it("6 DELETE /api/v1/user/ created_test user should return 200 with parameters", async () => {
        try {
            const config = Service.getService<Config>(CONFIG_SERVICE);
            const testUser = config.testUser;
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            const user = await repository
                .getByUsername("created_" + testUser.username);
            if (user) {
                request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/user/")
                    .send({
                        id: user.id
                    })
                    .end((err, res) => {
                        expect(res.body.user.removed).toBe(true);
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
    it("7 DELETE /api/v1/user/ test user should return 200 with parameters", async () => {
        try {
            const config = Service.getService<Config>(CONFIG_SERVICE);
            const testUser = config.testUser;
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            const user = await repository
                .getByUsername(testUser.username);
            if (user) {
                request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/user/")
                    .send({
                        id: user.id
                    })
                    .end((err, res) => {
                        expect(res.body.user.removed).toBe(true);
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

    it("9 POST /api/v1/user should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).put("/api/v1/user")
            .expect(400, done);
    });
    it("10 DELETE /api/v1/user should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/user")
            .expect(400, done);
    });
});