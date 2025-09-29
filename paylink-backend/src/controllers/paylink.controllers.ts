import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as paylinkService from "../services/paylink.services";

export const createClaim = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { body, user }  = req;
    
    console.log(body)
    const data = await paylinkService.createClaim(body, user);
    res.status(201).json({
      message: "Claim created successfully",
      data
    });
  },
);
