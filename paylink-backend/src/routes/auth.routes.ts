import { Router } from "express";
import { validate } from "../middlewares/validation";
import * as schemas from "../lib/schemas";
import * as authControllers from "../controllers/auth.controllers";

const authRouter = Router();

authRouter.post(
  "/nonce",
  validate({ body: schemas.createUserSchema }),
  authControllers.userNonce,
);

authRouter.post(
  "/verify",
  validate({ body: schemas.verifyUserSchema }),
  authControllers.userVerfication,
);

export default authRouter;
