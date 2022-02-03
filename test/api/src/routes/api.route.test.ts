import {Service} from "../../../../api/src/services/app.service";
import {
    APP_SERVICE,
    SERVER_SERVICE,
} from "../../../../api/src/services/app.constants";
import * as core from "express-serve-static-core";
import request from "supertest";
import http from "http";

describe("Service test api/src/routes/api.route", () => {
    const service = new Service();
    beforeAll( () => {
        service.bootstrap();
    });
    afterAll(async () => {
        await Service.getService<http.Server>(SERVER_SERVICE).close();
    });
    it("1 GET /api/v1 should return 200 OK", (done) => {
        request(Service.getService<core.Express>(APP_SERVICE)).get("/api/v1")
            .expect(200, done);
    });
});