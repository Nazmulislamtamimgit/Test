import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authC from "../controllers/auth.controller";
import * as userC from "../controllers/user.controller";
import * as taskC from "../controllers/task.controller";
import * as noteC from "../controllers/note.controller";
import * as sysC from "../controllers/system.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  loginSchema, noteSchema, noteUpdateSchema, profileSchema,
  registerSchema, taskSchema, taskUpdateSchema,
} from "../utils/schemas";

const router = Router();

// Stricter limit on credential endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "Too many attempts, try again later" },
});

// System (health endpoints are public so Nginx / monitors can probe them)
router.get("/health", sysC.health);
router.get("/health/database", sysC.databaseHealth);
router.get("/system/info", requireAuth, sysC.systemInfo);

// Auth
router.post("/auth/register", authLimiter, validateBody(registerSchema), authC.register);
router.post("/auth/login", authLimiter, validateBody(loginSchema), authC.login);
router.post("/auth/logout", authC.logout);
router.get("/auth/me", requireAuth, authC.me);

// Users
router.get("/users/profile", requireAuth, userC.getProfile);
router.put("/users/profile", requireAuth, validateBody(profileSchema), userC.updateProfile);
router.get("/users/stats", requireAuth, userC.stats);

// Tasks
router.get("/tasks", requireAuth, taskC.list);
router.post("/tasks", requireAuth, validateBody(taskSchema), taskC.create);
router.get("/tasks/:id", requireAuth, taskC.get);
router.put("/tasks/:id", requireAuth, validateBody(taskUpdateSchema), taskC.update);
router.delete("/tasks/:id", requireAuth, taskC.remove);

// Notes
router.get("/notes", requireAuth, noteC.list);
router.post("/notes", requireAuth, validateBody(noteSchema), noteC.create);
router.put("/notes/:id", requireAuth, validateBody(noteUpdateSchema), noteC.update);
router.delete("/notes/:id", requireAuth, noteC.remove);

export default router;
