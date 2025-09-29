import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import passport from "./config/passport-config";

import { CustomError } from "./lib/type";
import corsOptions from "./config/cors";
import indexRouter from "./routes/index.routes";
import authRouter from "./routes/auth.routes";
import paylinkRouter from "./routes/paylink.routes";

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60
});
app.use(limiter);

app.use("/api/auth/siwe", authRouter);
app.use("/api/paylink/", paylinkRouter);
app.use("/api", indexRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: "The route you are looking for does not exist.",
  });
});

app.use(
  (err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || "Something went wrong",
      details: err.details ?? undefined,
    });
  },
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
