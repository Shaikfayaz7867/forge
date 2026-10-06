import pino from "pino";
import { env, isDev } from "./env.js";

const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        // Production: structured JSON, no sensitive fields
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.passwordHash",
            "req.body.refreshToken",
            "*.password",
            "*.passwordHash",
            "*.token",
            "*.accessToken",
            "*.refreshToken",
          ],
          censor: "[REDACTED]",
        },
      }),
});

export default logger;
