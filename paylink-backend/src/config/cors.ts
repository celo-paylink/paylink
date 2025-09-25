import { AppError } from "../error/errorHandler";

const whitelist = process.env.CORS_WHITELIST?.split(",") || [];

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (error: Error | null, allowOrigin?: boolean | string) => void,
  ) {
    if (whitelist.includes(origin!) || !origin) {
      callback(null, origin);
    } else {
      callback(new AppError("Not allowed by CORS", 403));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export default corsOptions;
