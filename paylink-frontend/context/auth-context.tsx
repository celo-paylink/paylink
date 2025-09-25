'use client'

import { UserService } from '@/services/user';
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';

type User = {
  id?: string;
  address?: string;
  email?: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  isAuthenticated: boolean;
  authToken: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  error: string | null;
  authMessage: string | null;
  signAndVerify: (message: string) => Promise<string | null>;
  logout: () => void;
  requestAuthMessage: () => Promise<string | null>;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
    status?: number;
  };
  request?: unknown;
  message?: string;
  code?: number;
}

// Create the auth context with proper typing
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);

  const initializationComplete = useRef(false);
  const signaturePending = useRef(false);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      if (address) {
        setUser({ address });
      }
    }

    initializationComplete.current = true;
  }, [address]);

  useEffect(() => {
    if (isConnected && !authToken && !loading && initializationComplete.current) {
      if (!authInProgress && !signaturePending.current) {
        void startAuthFlow();
      }
    }

    if (!isConnected && authToken) {
      logout();
    }
  }, [isConnected, address, authToken, loading]);

  const startAuthFlow = async () => {
    if (!address || authInProgress) return;

    setAuthInProgress(true);
    setError(null);

    try {
      const message = await requestAuthMessage();
      if (message) {
        await signAndVerify(message);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Authentication failed");
    } finally {
      setAuthInProgress(false);
    }
  };

  const requestAuthMessage = async () => {
    if (!address) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await UserService.signOrLogin({ walletAddress: address });
      const message = response.data?.message;
      if (typeof message === 'string') {
        setAuthMessage(message);
        return message;
      }
      return null;
    } catch (err) {
      const error = err as ApiError;
      let errorMessage = "Failed to get authentication message";

      if (error.response) {
        errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from authentication server";
      } else {
        errorMessage = error.message || "Unknown error";
      }

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signAndVerify = async (message: string) => {
    if (!authMessage || !address) {
      setError('No authentication message or wallet address');
      return null;
    }

    if (signaturePending.current) {
      return null;
    }

    setLoading(true);
    setError(null);
    signaturePending.current = true;

    try {
      const signature = await signMessageAsync({
        message,
      });

      if (signature) {
        const verifyResponse = await UserService.verifySignature({
          walletAddress: address,
          signature,
          message
        });
        const token = verifyResponse.data?.token;
        const userData = verifyResponse.data?.user;

        if (token && userData) {
          setAuthToken(token);
          localStorage.setItem('paylink_auth_token', token);
          setAuthMessage(null);
          setUser(userData);
          return token;
        }
      }
      return null;

    } catch (err) {
      const error = err as ApiError;
      let errorMessage: string;

      if (error.code === 4001 || error.message?.includes('rejected')) {
        errorMessage = "Signature request was declined. Please try again.";
      } else if (error.message?.includes('timed out')) {
        errorMessage = "Signature request timed out. Please try again.";
      } else if (error.response) {
        errorMessage = error.response.data?.error || "Signature verification failed";
      } else {
        errorMessage = error.message || "An error occurred during authentication";
      }

      setError(errorMessage);
      setAuthMessage(null);
      return null;
    } finally {
      setLoading(false);
      signaturePending.current = false;
    }
  };

  const logout = () => {
    disconnect();
    setAuthToken(null);
    setAuthMessage(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const value: AuthContextType = {
    isAuthenticated: !!authToken,
    authToken,
    user,
    setUser,
    loading,
    error,
    authMessage,
    signAndVerify,
    logout,
    requestAuthMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}