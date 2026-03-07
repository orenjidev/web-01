import express from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";

import { GlobalConfig } from "../config/global.config.js";

import healthRoutes from "../api/routes/health.routes.js";
import apiRoutes from "../api/routes/index.js";
import { errorMiddleware } from "../api/middlewares/error.middleware.js";
import { initItemsCache } from "../services/items.service.js";
import { buildItems } from "../../scripts/build-items.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const CSV_PATH = path.resolve("data/items/Item.csv");
const OUTPUT_PATH = path.resolve("generated/items.web.json");

export function createExpressApp() {
  const app = express();

  // Build items from CSV then load into cache
  if (fs.existsSync(CSV_PATH)) {
    buildItems(CSV_PATH, OUTPUT_PATH)
      .then(({ itemCount }) => {
        console.log(`[startup] Built ${itemCount} items from CSV`);
        initItemsCache(true);
      })
      .catch((err) => {
        console.warn(`[startup] Items build failed: ${err.message}, trying existing JSON...`);
        try { initItemsCache(); } catch { /* no JSON available yet */ }
      });
  } else {
    // No CSV — try loading existing JSON
    try { initItemsCache(); } catch { /* no data yet */ }
  }

  // Swagger (dev only, staff-protected)
  // setupSwagger(app, {
  //   route: "/docs",
  //   enabled: process.env.ENABLE_SWAGGER === "true",
  //   requireAuthMiddleware: requireStaff,
  // });

  app.set("trust proxy", GlobalConfig.security.trustProxy);
  app.use(cookieParser());
  app.use(express.json());

  // cors — supports comma-separated WEB_URL list (e.g. for multiple frontends)
  app.use(
    cors({
      origin: (process.env.WEB_URL || "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean),
      credentials: true,
    }),
  );

  // upload
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  //itemshop icon
  // Recreate __dirname in ES module scope
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Serve static shop icons
  app.use(
    "/images/shop",
    express.static(path.join(__dirname, "../../public/images/shop")),
  );

  // 🔐 SESSION MIDDLEWARE (PUT IT HERE)
  app.use(
    session({
      name: process.env.COOKIE,
      secret: process.env.SESSION_SECRET || "dev-secret-change-later",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: "/",
        maxAge: 1000 * 60 * 60 * 2,
      },
    }),
  );

  // 🔗 CTX HYDRATION (PUT IT HERE)
  app.use((req, res, next) => {
    req.ctx = {
      user: req.session?.user,
      ip: req.ip,
      lang: req.headers["accept-language"] || "en",
      userAgent: req.headers["user-agent"] || null,
    };
    next();
  });

  // infra
  app.use("/health", healthRoutes);

  // app api
  app.use("/api", apiRoutes);

  app.use(errorMiddleware);

  return app;
}
