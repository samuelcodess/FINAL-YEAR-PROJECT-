import type { NextFunction, Request, Response } from "express";

import { findUserById } from "../repositories/userRepository";
import { ApiError } from "../utils/ApiError";
import { verifyToken } from "../utils/jwt";

export async function authenticate(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication token is required."));
  }

  try {
    const token = authorization.replace("Bearer ", "");
    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);

    if (!user) {
      return next(new ApiError(401, "Authenticated user no longer exists."));
    }

    request.user = {
      id: user.id,
      role: user.role,
      email: user.email
    };

    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token."));
  }
}
