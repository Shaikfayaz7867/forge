import swaggerUi from "swagger-ui-express";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Forge Fitness API",
    version: "1.0.0",
    description: "Production REST API for Forge — Gym workout planner + South Indian food & calorie tracker",
    contact: { name: "Forge Engineering", email: "support@forgeapp.com" },
  },
  servers: [
    { url: "http://localhost:4000/api/v1", description: "Development server" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer JWT token",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          role: { type: "string", enum: ["USER", "ADMIN"] },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
            },
          },
          requestId: { type: "string" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Basic health check",
        responses: { 200: { description: "Server is healthy" } },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "test@example.com" },
                  password: { type: "string", example: "SecurePass123" },
                  name: { type: "string", example: "Rahul" },
                },
                required: ["email", "password", "name"],
              },
            },
          },
        },
        responses: { 201: { description: "User registered" } },
      },
    },
    "/auth/login": {
      post: {
        summary: "User login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 200: { description: "Tokens generated" } },
      },
    },
  },
};

export const serveSwagger = swaggerUi.serve;
export const setupSwagger = swaggerUi.setup(swaggerSpec);
