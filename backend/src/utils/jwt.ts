import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";
import type { AuthPayload } from "../types/domain";

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, env.jwtSecret) as JwtPayload & AuthPayload;

  return {
    sub: Number(payload.sub),
    role: payload.role,
    email: payload.email
  };
}
