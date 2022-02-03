import {Service} from "../../../../api/src/services/app.service";
import {
    ACCOUNT_REPOSITORY_SERVICE,
    APP_SERVICE, CONFIG_SERVICE, ROLE_REPOSITORY_SERVICE,
    SERVER_SERVICE, USER_REPOSITORY_SERVICE,
} from "../../../../api/src/services/app.constants";
import * as core from "express-serve-static-core";
import request from "supertest";
import http from "http";
import {Config} from "../../../../api/src/util/secrets";
import {UserRepository} from "../../../../api/src/db/storage/postgres/repository/user.repository";
import {RoleRepository} from "../../../../api/src/db/storage/postgres/repository/role.repository";
import {AccountRepository} from "../../../../api/src/db/storage/postgres/repository/account.repository";

describe("Service test api/src/routes/account.route", () => {
    jest.setTimeout(30000);
    const service = new Service();
    beforeAll( () => {
        service.bootstrap();
    });
    afterAll(async () => {
        const repository = Service.getService<AccountRepository>(ACCOUNT_REPOSITORY_SERVICE);
        const updatedAccount = await repository
            .getByName("updated_test_account");
        if (updatedAccount) {
            await repository.remove(updatedAccount);
        }
        const account = await repository
            .getByName("test_account");
        if (account) {
            await repository.remove(account);
        }
        await Service.getService<http.Server>(SERVER_SERVICE).close();
        await new Promise(resolve => setTimeout(() => resolve({}), 10000));
    });
    it("1 GET /api/v1/account should return 200 OK", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).get("/api/v1/account")
            .expect(200, done);
    });
    // root should exist
    it("2 GET /api/v1/account/1 should return 200 OK", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).get("/api/v1/account/1")
            .expect(200, done);
    });
    it("3 PUT /api/v1/account should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).put("/api/v1/account")
            .expect(400, done);
    });
    it("4 POST /api/v1/account should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).put("/api/v1/account")
            .expect(400, done);
    });
    it("5 DELETE /api/v1/account should return 401 without parameters", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/account")
            .expect(400, done);
    });

    // create
    it("6 POST /api/v1/account create should return 200 with parameters", async () => {
        try {
            const repository = Service.getService<AccountRepository>(ACCOUNT_REPOSITORY_SERVICE);
            const account = await repository
                .getByName("test_account");
            if (account === null) {
                request(Service.getService<core.Express>(APP_SERVICE)).post("/api/v1/account")
                    .send({
                        name: "test_account",
                        email: "test.account@example.com",
                        fid: "demo fargo id",
                        uid: "test_account_uid",
                        customerPortalId: "test_cp_uuid",
                        type: "svf",
                        status: "active"
                    })
                    .end(async (err, res) => {
                        console.log(res.body);
                        expect(err).toBe(null);
                    });
            } else {
                expect(account).not.toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
    // update
    it("7 PUT /api/v1/account update should return 200 with parameters", async () => {
        try {
            const repository = Service.getService<AccountRepository>(ACCOUNT_REPOSITORY_SERVICE);
            const account = await repository
                .getByName("test_account");
            if (account) {
                request(Service.getService<core.Express>(APP_SERVICE)).put("/api/v1/account")
                    .send({
                        id: account.id,
                        name: "updated_test_account",
                        email: "test.account@example.com",
                        fid: "demo fargo id",
                        uid: "test_account_uid",
                        customerPortalId: "test_cp_uuid",
                        type: "svf",
                        status: "active"
                    })
                    .end(async (err, res) => {
                        console.log(res.body);
                        expect(err).toBe(null);
                    });
            } else {
                expect(account).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
    // delete
    it("8 DELETE /api/v1/account/ updated_test_role should return 200 with parameters", async () => {
        try {
            const repository = Service.getService<AccountRepository>(ACCOUNT_REPOSITORY_SERVICE);
            const account = await repository
                .getByName("updated_test_account");
            if (account) {
                request(Service.getService<core.Express>(APP_SERVICE)).delete("/api/v1/account/")
                    .send({
                        id: account.id
                    })
                    .end((err, res) => {
                        console.log(res.body);
                        expect(err).toBe(null);
                    });
            } else {
                expect(account).toBe(null);
            }
        } catch (e) {
            expect(e).toMatch("error");
        }
    });
});