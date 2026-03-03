import "dotenv/config";
import process from "node:process";

const required = ["NODE_ENV", "PORT"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[ENV] Missing required variable: ${key}`);
    process.exit(1);
  }
}

export const Env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT),
});
