import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { corsOptions } from "./config/cors.js";
import { requestId } from "./middleware/request-id.js";
import { generalLimiter } from "./middleware/rate-limit.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import { serveSwagger, setupSwagger } from "./docs/swagger.js";
import apiRouter from "./routes/index.js";

const app = express();

// Security Headers
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Request tracking
app.use(requestId);

// Rate limiting
app.use(generalLimiter);

// Serve static uploaded files (progress photos)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Swagger Documentation
app.use("/docs", serveSwagger, setupSwagger);
app.use("/api-docs", serveSwagger, setupSwagger);

// API v1 Router
app.use("/api/v1", apiRouter);

// 404 & Global Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
