import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/errorHandler";

type SchemaMap = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export const validate =
  (schemas: SchemaMap) => (req: Request, res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success)
        throw new AppError(
          "Validation failed",
          400,
          result.error.flatten().fieldErrors,
        );
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success)
        throw new AppError(
          "Validation failed",
          400,
          result.error.flatten().fieldErrors,
        );
      req.validatedQuery = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success)
        throw new AppError(
          "Validation failed",
          400,
          result.error.flatten().fieldErrors,
        );
      req.params = result.data;
    }

    next();
  };
