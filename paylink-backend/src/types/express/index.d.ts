import { Role } from "@prisma/client"; // if you use enum Role
import { JwtPayload } from "../auth";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: string;
      walletAddress: string;
      role: Role;
    }
  }
}

declare module "express" {
  export interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validatedQuery?: any; // you can replace `any` with a custom Zod-inferred type
  }
}
