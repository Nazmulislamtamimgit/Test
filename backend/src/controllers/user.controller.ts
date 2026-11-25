import { asyncHandler } from "../utils/http";
import * as users from "../services/user.service";

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: await users.getUser(req.userId!) });
});
export const updateProfile = asyncHandler(async (req, res) => {
  res.json({ user: await users.updateProfile(req.userId!, req.body) });
});
export const stats = asyncHandler(async (req, res) => {
  res.json(await users.getStats(req.userId!));
});
