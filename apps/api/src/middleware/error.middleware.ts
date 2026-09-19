import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;

  logger.error(
    {
      status,
      path: req.path,
      method: req.method,
      businessId: req.user?.businessId,
      err: status >= 500 ? err : undefined, // full stack only for real server errors
    },
    err.message || "Unhandled error"
  );

  res.status(status).json({
    message: err.message || "Something went wrong on the server",
  });
};
