import request from "supertest";
import app from "../src/app.js";

describe("Auth API Endpoints", () => {
  describe("POST /api/v1/auth/register", () => {
    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "invalid-email", password: "Password123", name: "Test User" });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toEqual("VALIDATION_ERROR");
    });

    it("should reject weak passwords", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "test@example.com", password: "123", name: "Test User" });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return 401 for invalid credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nonexistent@example.com", password: "WrongPassword123" });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});
