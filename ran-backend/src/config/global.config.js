import { Env } from "./env.js";

export const GlobalConfig = Object.freeze({
  app: {
    name: "ran-api",
    env: Env.NODE_ENV,
    isProd: Env.NODE_ENV === "production",
  },

  server: {
    port: Env.PORT,
  },

  security: {
    trustProxy: 1,
  },
});
