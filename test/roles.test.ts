import request from "supertest";
import app from "../api/src/app";
import { expect} from "chai";

// describe("GET /contact", () => {
//     it("should return 200 OK", (done) => {
//         request(app).get("/contact")
//             .expect(200, done);
//     });
// });
//
//
describe("PUT /api/v1/role", () => {
    it("should return false from assert when no message is found", (done) => {
        request(app).put("/api/v1/role")
            .field("id", "1")
            .field("users", "[15]")
            .end(function(err, res) {
                expect(res.error).to.be.false;
                done();
            })
            .expect(302);

    });
});