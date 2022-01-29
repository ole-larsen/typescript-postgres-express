import request from "supertest";
import app from "../api/src/app";

describe("GET /api/v1", () => {
    it("should return 200 OK", () => {
        return request(app).get("/api/v1")
            .expect(200);
    });
});
