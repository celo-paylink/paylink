import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as paylinkService from "../services/paylink.services";

export const createClaim = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { body, user }  = req;
    const data = await paylinkService.createClaim(body, user);
    res.status(201).json({
      message: "Claim created successfully",
      data
    });
  },
);

export const getClaim = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { claimCode }  = req.params;
    const data = await paylinkService.getClaim(claimCode);
    res.status(201).json({
      message: "Claim fetched successfully",
      data
    });
  },
);

export const getUserClaims = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id  = req.user?.id as string;
    const data = await paylinkService.getUserClaims(id);

    res.status(201).json({
      message: "Claims fetched successfully",
      data
    });
  },
);

export const confirmClaim = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { body }  = req;
    const data = await paylinkService.confirmClaim(body);
    res.status(201).json({
      message: "Claimed funds successfully",
      data
    });
  },
);

export const reclaimClaim = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { body }  = req;
    const data = await paylinkService.getClaim(body);
    res.status(201).json({
      message: "Reclaimed funds successfully",
      data
    });
  },
);
