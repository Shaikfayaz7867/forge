import request from "supertest";
import app from "../src/app.js";

describe("Health API", () => {
  it("GET /api/v1/health should return status ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
  });

  it("GET /api/v1/health/live should return status live", async () => {
    const res = await request(app).get("/api/v1/health/live");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: "live" });
  });
});
