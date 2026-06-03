import type { NextFunction, Request, Response } from "express";

import type { AppRole } from "../constants/roles";
import { ApiError } from "../utils/ApiError";

export function authorize(...allowedRoles: AppRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      return next(new ApiError(401, "Authentication is required."));
    }

    if (!allowedRoles.includes(request.user.role)) {
      return next(new ApiError(403, "You do not have access to this resource."));
    }

    return next();
  };
}
