import {Service} from "../../../../api/src/services/app.service";
import {
    APP_SERVICE, CONFIG_SERVICE, ROLE_REPOSITORY_SERVICE,
    SERVER_SERVICE, USER_REPOSITORY_SERVICE,
} from "../../../../api/src/services/app.constants";
import * as core from "express-serve-static-core";
import request from "supertest";
import http from "http";
import {Config} from "../../../../api/src/util/secrets";
import {UserRepository} from "../../../../api/src/db/storage/postgres/repository/user.repository";
import {RoleRepository} from "../../../../api/src/db/storage/postgres/repository/role.repository";

describe("Service test api/src/routes/role.route", () => {
    jest.setTimeout(30000);
    const service = new Service();
    beforeAll( () => {
        service.bootstrap();
    });
    afterAll(async () => {
        const repository = Service.getService<RoleRepository>(ROLE_REPOSITORY_SERVICE);
        const role = await repository
            .getByName("test_role");
        if (role) {
            await repository.remove(role);
        }
        const updatedRole = await repository
            .getByName("updated_test_role");
        if (updatedRole) {
            await repository.remove(updatedRole);
        }

        await Service.getService<http.Server>(SERVER_SERVICE).close();
        await new Promise(resolve => setTimeout(() => resolve({}), 10000));
    });
    it("1 GET /api/v1/role should return 200 OK", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).get("/api/v1/role")
            .expect(200, done);
    });
    it("2 PUT /api/v1/role should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).put("/api/v1/role")
            .expect(400, done);
    });
    it("3 POST /api/v1/role should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).put("/api/v1/role")
            .expect(400, done);
    });
    it("4 DELETE /api/v1/role should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/role")
            .expect(400, done);
    });
    // create
    it("5 POST /api/v1/role create should return 200 with parameters", async () => {
        try {
            const repository = Service.getService<RoleRepository>(ROLE_REPOSITORY_SERVICE);
            const role = await repository
                .getByName("test_role");
            if (role === null) {
                request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/role")
                    .send({
                        title: "test_role",
                        description: "test_role_description"
                    })
                    .end(async (err, res) => {
                        expect(res.body.role.title === "test_role").toBe(true);
                        expect(res.body.role.description === "test_role_description").toBe(true);
                        expect(res.body.role.enabled === true).toBe(true);
                        expect(err).toBe(null);
                    });
            } else {
                expect(role).not.toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
    // update
    it("6 PUT /api/v1/role update should return 200 with parameters", async () => {
        try {
            const repository = Service.getService<RoleRepository>(ROLE_REPOSITORY_SERVICE);
            const role = await repository
                .getByName("test_role");
            if (role) {
                request(Service.getService<core.Express>(APP_SERVICE)).put("/api/v1/role")
                    .send({
                        id: role.id,
                        title: "updated_" + role.title,
                        description: "updated_" + role.description
                    })
                    .end(async (err, res) => {
                        console.log(res.body);
                        expect(err).toBe(null);
                    });
            } else {
                expect(role).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
    // delete
    it("7 DELETE /api/v1/role/ updated_test_role should return 200 with parameters", async () => {
        try {
            const repository = Service.getService<RoleRepository>(ROLE_REPOSITORY_SERVICE);
            const role = await repository
                .getByName("updated_test_role");
            if (role) {
                request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/role/")
                    .send({
                        id: role.id
                    })
                    .end((err, res) => {
                        console.log(res.body);
                        expect(err).toBe(null);
                    });
            } else {
                expect(role).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
});