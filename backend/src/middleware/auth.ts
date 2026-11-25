import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../utils/http";

export const COOKIE_NAME = "session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Reads the signed HttpOnly cookie, verifies the JWT and attaches req.userId.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.signedCookies?.[COOKIE_NAME]; // false when the signature is invalid
  if (!token) throw new HttpError(401, "Not authenticated");
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (!payload.sub) throw new Error("no subject");
    req.userId = payload.sub;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }
}
