import {Service} from "../../../api/src/services/app.service";

describe("api/src/app", () => {
    const service = new Service();
    it("1 Service is service test", () => {
        expect(service instanceof Service).toBe(true);
    });
    it("2 Service has bootstrap method", () => {
        expect(typeof service.bootstrap).toBe("function");
    });
    it("3 Service has log method", () => {
        expect(typeof service.log).toBe("function");
    });
});