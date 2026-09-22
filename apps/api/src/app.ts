import express from "express";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import routes from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { logger } from "./config/logger";

// The Express app, fully configured but NOT listening on any port.
// index.ts wraps this with an http server + Socket.io for the real process.
// tests/integration/*.test.ts import this directly and drive it with supertest,
// with no network port involved.
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  try {
    const openapiDocument = YAML.load(path.join(__dirname, "..", "openapi.yaml"));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
  } catch (err) {
    logger.warn("Could not load openapi.yaml - /api-docs will be unavailable");
  }

  app.use("/api/v1", routes);

  app.use(errorMiddleware);

  return app;
}