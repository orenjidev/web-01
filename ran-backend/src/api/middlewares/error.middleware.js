import * as Sentry from "@sentry/node";

export function errorMiddleware(err, req, res, next) {
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  console.error(err);

  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    message: isProd ? "Internal Server Error" : (err.message || "Internal Server Error"),
  });
}
