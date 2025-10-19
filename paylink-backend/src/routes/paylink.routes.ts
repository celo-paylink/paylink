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
  "/claim/:claimCode",
  validate({ params: schemas.claimCodeParamSchema }),
  paylinkControllers.getClaim
);

paylinkRouter.put(
  "/claim/confirm",
  validate({ body: schemas.confirmClaimSchema }),
  paylinkControllers.confirmClaim
);

paylinkRouter.put(
  "/reclaim/confirm",
  validate({ body: schemas.reclaimClaimSchema }),
  paylinkControllers.reclaimClaim
);

export default paylinkRouter;
