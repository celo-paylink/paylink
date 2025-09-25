import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import * as authService from "../services/auth.services";

export const userNonce = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { walletAddress } = req.body;

    const data = await authService.userNonce({ walletAddress });

    res.status(201).json(data);
  },
);

export const userVerfication = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { walletAddress, signature, message } = req.body;

    const data = await authService.userVerfication({
      walletAddress,
      signature,
      message,
    });

    res.status(201).json(data);
  },
);
