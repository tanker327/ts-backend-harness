import { pinoLogger } from "hono-pino";
import pino from "pino";
import { env } from "../config/env.ts";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  ...(env.NODE_ENV !== "production" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});

export function honoLogger() {
  return pinoLogger({
    pino: logger,
  });
}
