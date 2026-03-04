import * as Sentry from "@sentry/node";

export function errorMiddleware(err, req, res, next) {
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
}
