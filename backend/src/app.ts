import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import routes from "./routes";
import { logger } from "./utils/logger";

export const app = express();

app.set("trust proxy", 1); // one proxy hop (Nginx) so req.ip and rate limiting use the real client IP
app.disable("x-powered-by");

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "Too many requests, slow down" },
}));

app.use("/api", routes);
app.use("/api", notFound);
app.use(errorHandler);
