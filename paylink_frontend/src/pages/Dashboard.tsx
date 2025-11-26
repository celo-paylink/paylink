import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { TrendingUp, Activity, Wallet, Clock, Link as LinkIcon } from 'lucide-react';
import { PaylinkService } from '../services/paylink';
import { useMemo } from 'react';
import { NavLink } from 'react-router';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  // Fetch user's claims/paylinks
  const { data, isLoading, error } = useQuery({
    queryKey: ['userClaims', address],
    queryFn: () => PaylinkService.getUserClaims(),
    enabled: !!isConnected && !!address,
  });

  const claims = data?.data?.claims || [];

  // Calculate statistics
  const stats = useMemo(() => {
    const total = claims.length;
    const claimed = claims.filter((claim: any) => claim.status === 'CLAIMED').length;
    const reclaimed = claims.filter((claim: any) => claim.status === 'RECLAIMED').length;
    const active = claims.filter((claim: any) => {
      const isExpired = new Date(claim.expiry) < new Date();
      return claim.status === 'CREATED' && !isExpired;
    }).length;
    const pending = claims.filter((claim: any) => {
      const isExpired = new Date(claim.expiry) < new Date();
      return claim.status === 'CREATED' && !isExpired;
    }).length;

    return {
      total,
      active,
      claimed,
      pending,
      reclaimed,
    };
  }, [claims]);

  if (!isConnected) {
    return (
      <div className="container py-12">
        <div className="glass-card text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gradient-purple)] to-[var(--gradient-cyan)] mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            Please connect your wallet to view your dashboard and paylink activity
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">
            Your <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="text-[var(--text-muted)]">
            Track your paylinks and activity
          </p>
        </div>
        <div className="glass-card text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">
            Your <span className="gradient-text">Dashboard</span>
          </h2>
        </div>
        <div className="glass-card text-center py-12">
          <p className="text-red-500 mb-2">Failed to load dashboard data</p>
          <p className="text-[var(--text-muted)] text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">
          Your <span className="gradient-text">Dashboard</span>
        </h2>
        <p className="text-[var(--text-muted)]">
          Track your paylinks and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Total Created */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--gradient-purple)] to-[var(--gradient-blue)]">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-[var(--text-muted)] text-sm">All Time</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.total}</p>
          <p className="text-sm text-[var(--text-muted)]">Total Paylinks</p>
        </div>

        {/* Active */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--gradient-blue)] to-[var(--gradient-cyan)]">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-[var(--text-muted)] text-sm">Active</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.active}</p>
          <p className="text-sm text-[var(--text-muted)]">Active Links</p>
        </div>

        {/* Claimed */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--gradient-cyan)] to-[var(--accent-green)]">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            {stats.total > 0 && (
              <span className="badge badge-success">
                {Math.round((stats.claimed / stats.total) * 100)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold mb-1">{stats.claimed}</p>
          <p className="text-sm text-[var(--text-muted)]">Successfully Claimed</p>
        </div>

        {/* Pending */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--gradient-purple)]">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-[var(--text-muted)] text-sm">Awaiting</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.pending}</p>
          <p className="text-sm text-[var(--text-muted)]">Pending Claims</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card">
        <h3 className="text-2xl font-bold mb-6">Recent Paylinks</h3>

        {claims.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gradient-purple)] to-[var(--gradient-cyan)] mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <p className="text-[var(--text-secondary)] mb-4">No paylinks created yet</p>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
              Create your first paylink to start sending secure payments on the Celo blockchain
            </p>
            <NavLink to={'/create'} className="btn btn-primary">Create Your First Paylink</NavLink>

          </div>
        ) : (
          <div className="space-y-4">
            {claims.slice(0, 5).map((claim: any) => {
              const isExpired = new Date(claim.expiry) < new Date();
              const statusColor =
                claim.status === 'CLAIMED' ? 'var(--accent-green)' :
                  claim.status === 'RECLAIMED' ? 'var(--gradient-cyan)' :
                    isExpired ? '#ef4444' : '#fbbf24';

              const statusLabel =
                claim.status === 'CLAIMED' ? 'Claimed' :
                  claim.status === 'RECLAIMED' ? 'Reclaimed' :
                    isExpired ? 'Expired' : 'Active';

              return (
                <div
                  key={claim.claimCode}
                  className="flex items-center justify-between p-4 rounded-xl transition-all hover:bg-[rgba(139,92,246,0.05)]"
                  style={{ border: '1px solid rgba(139, 92, 246, 0.1)' }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--gradient-purple)] to-[var(--gradient-cyan)]">
                      <LinkIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{claim.claimCode}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{parseFloat(claim.amount) / 1e18} CELO</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {claim.token === '0x0000000000000000000000000000000000000000' ? 'Native' : 'Token'}
                      </p>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${statusColor}20`,
                        color: statusColor
                      }}
                    >
                      {statusLabel}
                    </div>
                  </div>
                </div>
              );
            })}

            {claims.length > 5 && (
              <div className="text-center pt-4">
                <a href="/reclaim" className="btn btn-ghost">
                  View All Paylinks →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
