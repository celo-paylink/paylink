import { Router } from "express";
import { validate } from "../middlewares/validation";
import * as schemas from "../lib/schemas";
import { isAuthenticated } from "../middlewares/auth.middleware";
import * as paylinkControllers from "../controllers/paylink.controllers";

const paylinkRouter = Router();

paylinkRouter.use(isAuthenticated);

paylinkRouter.post(
  "/create",
  validate({ body: schemas.createClaimSchema }),
  paylinkControllers.createClaim
);

paylinkRouter.get(
  "/create",
  (req, res) => {
    res.send("Hello from paylink create GET endpoint");
  }
);

export default paylinkRouter;
