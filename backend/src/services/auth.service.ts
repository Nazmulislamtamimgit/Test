import bcrypt from "bcrypt";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { cookieSecure, env } from "../config/env";
import { COOKIE_NAME } from "../middleware/auth";
import { HttpError } from "../utils/http";
import { prisma } from "../utils/prisma";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
// Compared against when the email is unknown so login timing does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export const publicUser = { id: true, email: true, name: true, createdAt: true, updatedAt: true } as const;

export function startSession(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // not readable from JavaScript (XSS-resistant)
    secure: cookieSecure,
    sameSite: "lax", // blocks cross-site POSTs (CSRF)
    signed: true,
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  });
}

export function endSession(res: Response) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: cookieSecure, sameSite: "lax", signed: true, path: "/" });
}

export async function register(input: { name: string; email: string; password: string }) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new HttpError(409, "Email is already registered");
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: publicUser,
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, "Invalid email or password");
  const { passwordHash: _omit, ...safe } = user;
  return safe;
}
