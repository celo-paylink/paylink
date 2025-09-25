import jwt from "jsonwebtoken";
import { AppError } from "../error/errorHandler";

export const signJWT = (payload: object, expiresAt: number): string => {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: expiresAt,
  });
  return token;
};

export const verifyJWT = <T>(token: string): T | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as T;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(
        "JWT Token has expired. Please request a new one.",
        401,
      );
    } else {
      throw new AppError("Could not verify token.", 500);
    }
  }
};
