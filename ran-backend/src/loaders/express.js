import express from "express";
import session from "express-session";
import cors from "cors";

import { GlobalConfig } from "../config/global.config.js";

import healthRoutes from "../api/routes/health.routes.js";
import apiRoutes from "../api/routes/index.js";
import { errorMiddleware } from "../api/middlewares/error.middleware.js";
import { initItemsCache } from "../services/items.service.js";
import path from "path";
import { fileURLToPath } from "url";

export function createExpressApp() {
  const app = express();

  // preload items
  initItemsCache();

  // Swagger (dev only, staff-protected)
  // setupSwagger(app, {
  //   route: "/docs",
  //   enabled: process.env.ENABLE_SWAGGER === "true",
  //   requireAuthMiddleware: requireStaff,
  // });

  app.set("trust proxy", GlobalConfig.security.trustProxy);
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
      secret: "dev-secret-change-later",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // true only on HTTPS
        path: "/", // 🔑 IMPORTANT
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
