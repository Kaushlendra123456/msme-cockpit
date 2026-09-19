import pino from "pino";

// Structured JSON logging — this is the "operational evidence" (logs) piece.
// In production, pipe stdout to a log aggregator (CloudWatch, Loki, etc.);
// pino's JSON output is designed to be machine-parseable for that.
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
