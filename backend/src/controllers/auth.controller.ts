import { asyncHandler } from "../utils/http";
import * as auth from "../services/auth.service";
import { getUser } from "../services/user.service";

export const register = asyncHandler(async (req, res) => {
  const user = await auth.register(req.body);
  auth.startSession(res, user.id);
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
  const user = await auth.login(req.body.email, req.body.password);
  auth.startSession(res, user.id);
  res.json({ user });
});

export const logout = asyncHandler(async (_req, res) => {
  auth.endSession(res);
  res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: await getUser(req.userId!) });
});
