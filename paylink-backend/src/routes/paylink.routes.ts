import { Router } from "express";
import { validate } from "../middlewares/validation";
import * as schemas from "../lib/schemas";
import { isAuthenticated } from "../middlewares/auth.middleware";

const paylinkRouter = Router();

paylinkRouter.use(isAuthenticated);

paylinkRouter.post(
  "/create",
  validate({ body: schemas.createUserSchema }),
);

export default paylinkRouter;
