import { AppError } from "../error/errorHandler";
import { Prisma } from "../generated/prisma";
import prisma from "../lib/prisma";

export async function getUserByWalletAddress(walletAddress: string) {
  try {
    const data = await prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while finding user by email", error.message);
    } else {
      console.error("Error occured while finding user by email", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function getUserById(id: string) {
  try {
    const data = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error occured while finding user by id", error.message);
    } else {
      console.error("Error occured while finding user by id", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function upsertUser(values: Prisma.UserCreateInput) {
  try {
    const { walletAddress, nonce, nonceExpiresAt } = values;
    const data = await prisma.user.upsert({
      where: { walletAddress: values.walletAddress },
      update: { nonce, nonceExpiresAt: nonceExpiresAt },
      create: {
        walletAddress: walletAddress,
        nonce,
        nonceExpiresAt: nonceExpiresAt,
      },
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating new user:", error.message);
    } else {
      console.error("Error creating new user:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}

export async function updateUser(id: string, values: Prisma.UserUpdateInput) {
  try {
    const data = await prisma.user.update({
      where: { id },
      data: values,
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating user:", error.message);
    } else {
      console.error("Error updating user:", error);
    }
    throw new AppError("Internal server error", 500);
  }
}
