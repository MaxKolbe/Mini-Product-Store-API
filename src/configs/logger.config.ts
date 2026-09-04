import winston from "winston";
import { env } from "../configs/env.config.js"

const { combine, timestamp, json, errors, align, colorize, printf } = winston.format;
const isProduction = env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: env.LOG_LEVEL || "info",
  format: combine(
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    errors({ stack: true }),
    isProduction
      ? combine(json(), align())
      : combine(
          colorize(),
          printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
            return `${timestamp} ${level}: ${message}${metaStr}`;
          }),
        ),
  ),
  defaultMeta: { service: "store-api" },
  transports: [new winston.transports.Console()],
});

export default logger;