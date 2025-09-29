'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const UNPROTECTED_PAGES = ['/'];

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const {
    isAuthenticated,
    loading,
    error: authError,
  } = useAuth();
  const { openConnectModal } = useConnectModal();

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  const shouldBypassAuth = UNPROTECTED_PAGES.includes(pathname);

  const initiateAuth = useCallback(async () => {
    if (isAuthenticated) {
      return;
    }


    try {
      setWalletLoading(true);

      if (!isConnected) {
        if (openConnectModal) {
          openConnectModal();
        } else {
          throw new Error("Wallet connection not available. Please try again.");
        }
        return;
      }
    } catch (err: Error | unknown) {
      setShowError(true);
      setErrorMessage(err instanceof Error ? err.message : "Failed to authenticate. Please try again.");
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setWalletLoading(false);
    }
  }, [isAuthenticated, isConnected, openConnectModal]);

  const handleConnectWallet = () => {
    initiateAuth();
  };

  useEffect(() => {
    if (isAuthenticated || !isConnected) {
      setShowError(false);
    }
  }, [isAuthenticated, isConnected]);

  useEffect(() => {
    if (isAuthenticated || !isConnected) {
      setShowError(false);
    }
  }, [isAuthenticated, isConnected]);

  useEffect(() => {
    if (authError) {
      setShowError(true);
      setErrorMessage(authError);
      setTimeout(() => setShowError(false), 5000);
    }
  }, [authError]);

  if (shouldBypassAuth) {
    return (
      <>
        {children}
      </>
    );
  }

  if (!isConnected) {
    return (
      <div className="mx-auto min-h-[calc(100vh-80px)] flex items-center">
        <div className="mx-auto max-w-[1200px] w-[90%] flex items-center justify-center h-full bg-transparent flex-col">
          <div className="mt-6 flex flex-col items-center">
            <button
              onClick={handleConnectWallet}
              disabled={loading || walletLoading}
              className={`px-10 md:px-12 py-3 md:py-6 rounded-[20px] cursor-pointer transition-all duration-500 text-white text-[28px] font-extrabold bg-green-600 focus:outline-none tracking-wide ${(loading || walletLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading || walletLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-6 w-6 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : 'Connect Wallet'}
            </button>

            {showError && (
              <div className="mt-6 text-white bg-red-500/40 px-6 py-3 rounded-lg text-center max-w-md">
                <p className="font-medium">Authentication Error</p>
                <p className="text-sm mt-1">{errorMessage || "Something went wrong. Please try again."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="px-5 md:px-8 lg:px-10 xl:px-12 2xl:px-16 flex items-center justify-center min-h-screen bg-[url('/images/imgs/BizFlip.png')] bg-cover bg-center text-white"
      >
        <div className="text-center">
          {loading ? (
            <>
              <div className="flex justify-center items-center mb-4">
                <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin"></div>
              </div>
              <p>Authenticating...</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-gray-600">Please complete authentication to access this content.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}