import { corsOrigins } from "./env.js";

export const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true, // required for HttpOnly cookie auth
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-CSRF-Token"],
  exposedHeaders: ["X-Request-ID"],
  maxAge: 600, // preflight cache 10 min
};
