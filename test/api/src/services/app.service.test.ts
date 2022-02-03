import {Service} from "../../../../api/src/services/app.service";
import {
    CONFIG_SERVICE,
    APP_SERVICE,
    POSTGRES_SERVICE,
    PROMETHEUS_SERVICE,
    EMITTER_SERVICE,
    ROLE_REPOSITORY_SERVICE,
    USER_REPOSITORY_SERVICE,
    ACCOUNT_REPOSITORY_SERVICE, SERVER_SERVICE,
} from "../../../../api/src/services/app.constants";
import {Config} from "../../../../api/src/util/secrets";
import {Pool} from "pg";
import * as core from "express-serve-static-core";
import {Prometheus} from "../../../../api/src/monitoring/prometheus";
import {EventEmitter} from "events";
import {RoleRepository}    from "../../../../api/src/db/storage/postgres/repository/role.repository";
import {UserRepository}    from "../../../../api/src/db/storage/postgres/repository/user.repository";
import {AccountRepository} from "../../../../api/src/db/storage/postgres/repository/account.repository";

import http from "http";

describe("Service test api/src/services/app", () => {
    const service = new Service();
    beforeAll( () => {
        service.bootstrap();
    });
    afterAll(async () => {
        await Service.getService<http.Server>(SERVER_SERVICE).close();
    });
    it ("1 Service has fetchJSON static method", () => {
        expect(typeof Service.fetchJSON).toBe("function");
    });
    it ("2 Service has hash static method", () => {
        expect(typeof Service.hash).toBe("function");
    });
    it ("3 Service has addService static method", () => {
        expect(typeof Service.addService).toBe("function");
    });
    it ("4 Service has getService static method", () => {
        expect(typeof Service.getService).toBe("function");
    });
    it ("5 Service has diSetup method", () => {
        expect(typeof service.diSetup).toBe("function");
    });
    it ("6 Service has setup method", () => {
        expect(typeof service.setup).toBe("function");
    });
    it ("7 Service has router method", () => {
        expect(typeof service.router).toBe("function");
    });
    it ("8 Service has swagger method", () => {
        expect(typeof service.swagger).toBe("function");
    });
    it ("9 Service has prometheus method", () => {
        expect(typeof service.prometheus).toBe("function");
    });
    it ("9 Service has serve method", () => {
        expect(typeof service.serve).toBe("function");
    });
    it ("10 config.connections.database.url exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).connections.database.url).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).connections.database.url === process.env["TEST_DATABASE_URL"]).toBe(true);
    });
    it ("11 config.connections.database.port exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).connections.database.port).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).connections.database.port === process.env["TEST_DATABASE_PORT"]).toBe(true);
    });
    it ("12 config.app.port exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).app.port).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).app.port === process.env["SERVER_PORT"]).toBe(true);
    });
    it ("13 config.app.secret exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).app.secret).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).app.secret === process.env["SESSION_SECRET"]).toBe(true);
    });
    it ("14 config.app.domain exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).app.domain).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).app.domain === process.env["DOMAIN"]).toBe(true);
    });
    it ("15 config.defaultUser.username exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).defaultUser.username).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).defaultUser.username === process.env["DEFAULT_USER_USERNAME"]).toBe(true);
    });
    it ("16 config.defaultUser.email exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).defaultUser.email).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).defaultUser.email === process.env["DEFAULT_USER_EMAIL"]).toBe(true);
    });
    it ("17 config.defaultUser.password exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).defaultUser.password).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).defaultUser.password === process.env["DEFAULT_USER_PASSWORD"]).toBe(true);
    });
    it ("18 config.test.username exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).testUser.username).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).testUser.username === process.env["TEST_USER_USERNAME"]).toBe(true);
    });
    it ("19 config.test.email exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).testUser.email).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).testUser.email === process.env["TEST_USER_EMAIL"]).toBe(true);
    });
    it ("20 config.test.password exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).testUser.password).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).testUser.password === process.env["TEST_USER_PASSWORD"]).toBe(true);
    });
    it ("21 config.test.secret exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).testUser.secret).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).testUser.secret === process.env["TEST_USER_SECRET"]).toBe(true);
    });
    it ("22 config.test.code exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).testUser.code).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).testUser.code === process.env["TEST_USER_2FA_CODE"]).toBe(true);
    });
    it ("23 config.services.provider exists", () => {
        expect(!!Service.getService<Config>(CONFIG_SERVICE).services.provider).toBe(true);
        expect(Service.getService<Config>(CONFIG_SERVICE).services.provider === process.env["PROVIDER_URL"]).toBe(true);
    });
    it ("24 service app exists", () => {
        expect(!!Service.getService<core.Express>(APP_SERVICE)).toBe(true);
    });
    it ("25 service postgres exists", () => {
        expect(!!Service.getService<Pool>(POSTGRES_SERVICE)).toBe(true);
    });
    it ("26 service prometheus exists", () => {
        expect(!!Service.getService<Prometheus>(PROMETHEUS_SERVICE)).toBe(true);
    });
    it ("27 service emitter exists", () => {
        expect(!!Service.getService<EventEmitter>(EMITTER_SERVICE)).toBe(true);
    });
    it ("28 service role repository exists", () => {
        expect(!!Service.getService<RoleRepository>(ROLE_REPOSITORY_SERVICE)).toBe(true);
    });
    it ("29 service user repository exists", () => {
        expect(!!Service.getService<UserRepository>(USER_REPOSITORY_SERVICE)).toBe(true);
    });
    it ("30 service account repository exists", () => {
        expect(!!Service.getService<AccountRepository>(ACCOUNT_REPOSITORY_SERVICE)).toBe(true);
    });
});