import { createContext } from "react";
import type { AuthContextType } from "./auth-context";

export const AuthContext = createContext<AuthContextType | null>(null);
