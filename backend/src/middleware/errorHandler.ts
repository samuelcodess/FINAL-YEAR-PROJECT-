import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/ApiError";

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      message: error.message
    });
  }

  const databaseError = error as Error & { code?: string };

  if (databaseError.code === "ER_DUP_ENTRY") {
    return response.status(409).json({
      message: "A record with the same unique value already exists."
    });
  }

  if (databaseError.code === "ER_NO_REFERENCED_ROW_2") {
    return response.status(400).json({
      message: "A referenced record does not exist."
    });
  }

  if (
    databaseError.code === "ECONNREFUSED" ||
    databaseError.code === "ENOTFOUND" ||
    databaseError.code === "PROTOCOL_CONNECTION_LOST"
  ) {
    return response.status(503).json({
      message: "Database connection is not available. Check your MySQL configuration."
    });
  }

  return response.status(500).json({
    message: "An unexpected server error occurred."
  });
}
