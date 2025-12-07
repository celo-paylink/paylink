import { useLocation } from 'react-router';
import { useAccount } from 'wagmi';
import CustomConnectButton from './connect-wallet-btn';

const UNPROTECTED_PAGES = ['/'];

export default function LayoutGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting } = useAccount();
  const location = useLocation();

  const shouldBypassAuth = UNPROTECTED_PAGES.includes(location.pathname);

  if (shouldBypassAuth) {
    return <>{children}</>;
  }

  if (isConnecting) {
    return (
      <div className="mx-auto min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="mx-auto min-h-[calc(100vh-80px)] flex items-center">
        <div className="mx-auto flex items-center justify-center h-full bg-transparent flex-col">
          <div className="mt-6 flex flex-col items-center">
            <CustomConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}