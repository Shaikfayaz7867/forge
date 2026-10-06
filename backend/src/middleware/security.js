import helmet from "helmet";
import { isProd } from "../config/env.js";

/**
 * Security headers middleware.
 * Uses Helmet with settings appropriate for an API that is consumed by a
 * separate frontend (not serving HTML directly from this server).
 */
export const security = helmet({
  contentSecurityPolicy: isProd
    ? {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"],
          scriptSrc: ["'none'"],
          styleSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      }
    : false, // disable CSP in dev (Swagger UI needs inline scripts)

  crossOriginEmbedderPolicy: false,  // Allow images to be embedded cross-origin
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin image fetch
  xFrameOptions: { action: "deny" },
  xContentTypeOptions: true,
  referrerPolicy: { policy: "no-referrer" },
  hsts: isProd
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
});
