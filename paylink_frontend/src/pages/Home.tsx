import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Coins, Share2, Shield } from 'lucide-react';
import StepCard from '../components/step-card';

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);

  // Responsive spacing configuration
  const [spacing, setSpacing] = useState({
    horizontalGap: 20,
    verticalStep: 15
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Reduce spacing by 50% on mobile (< 768px)
      if (mobile) {
        setSpacing({
          horizontalGap: 10,
          verticalStep: 7.5
        });
      } else {
        setSpacing({
          horizontalGap: 20,
          verticalStep: 15
        });
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Step configuration data
  const steps = [
    {
      stepNumber: 1,
      title: 'Create Paylink',
      description: 'Lock your funds in a secure smart contract and generate a unique payment link.',
      icon: Coins,
      gradientFrom: 'var(--gradient-purple)',
      gradientTo: 'var(--gradient-blue)',
      diagonalOffset: 0 * spacing.verticalStep  // 0rem
    },
    {
      stepNumber: 2,
      title: 'Share the Link',
      description: 'Send the payment link to anyone via email, messaging, or QR code.',
      icon: Share2,
      gradientFrom: 'var(--gradient-blue)',
      gradientTo: 'var(--gradient-cyan)',
      diagonalOffset: 1 * spacing.verticalStep  // 4rem
    },
    {
      stepNumber: 3,
      title: 'Claim or Reclaim',
      description: 'Recipients claim funds instantly, or you can reclaim if unclaimed after expiry.',
      icon: Shield,
      gradientFrom: 'var(--gradient-cyan)',
      gradientTo: 'var(--accent-primary)',
      diagonalOffset: 2 * spacing.verticalStep  // 8rem
    }
  ];

  return (
    <div
      className="scroll-snap-container"
      style={isMobile ? undefined : {
        height: '100vh',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth'
      }}
    >
      {/* Hero Section - Full Screen */}
      <section
        className="min-h-screen flex items-center justify-center container px-4 md:px-6"
        style={isMobile ? undefined : { scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
      >
        <div className="max-w-4xl mx-auto text-center fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight px-2">
            Send and Claim Funds
            <br />
            <span className="gradient-text">Securely on Celo</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-6 md:mb-10 px-4">
            Create shareable payment links in seconds. Simple, secure, and powered by blockchain technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
            <Link
              to="/create"
              className="btn btn-primary group w-full sm:w-auto"
            >
              Create Paylink
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="btn btn-ghost w-full sm:w-auto"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Full Screen */}
      <section
        className="min-h-screen flex flex-col items-center mt-12 container px-4 md:px-6 py-8 md:py-0"
        style={isMobile ? undefined : { scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 px-2">
          How it <span className="gradient-text-green">Works</span>
        </h2>

        {/* Staggered Diagonal Layout - Cascading from top-left to bottom-right */}
        <div
          className="flex flex-col md:flex-row max-w-6xl mx-auto w-full items-center md:items-start justify-center pb-8 md:pb-12 lg:pb-24"
          style={{
            gap: `${spacing.horizontalGap * 0.25}rem` // Dynamic horizontal gap
          }}
        >
          {steps.map((step) => (
            <StepCard key={step.stepNumber} {...step} />
          ))}
        </div>
      </section>

      {/* Footer - CLI Console Style */}
      <footer
        className="border-t border-[var(--border-primary)] py-12 bg-[var(--bg-secondary)]"
        style={isMobile ? { minHeight: '100vh', display: 'flex', alignItems: 'center' } : { scrollSnapAlign: 'start', minHeight: '100vh', display: 'flex', alignItems: 'center' }}
      >
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 mb-8 text-center">
            {/* Brand Section */}
            <div>
              <h6 className="text-[var(--accent-primary)] mb-4 font-mono text-sm">
                &gt; PAYLINK_
              </h6>
              <p className="text-[var(--text-muted)] text-sm mb-4 font-mono">
                Secure Web3 payment links on Celo blockchain.
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="https://github.com/celo-paylink/paylink/tree/main/paylink_frontend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://t.me/c/3686154526/3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
                  aria-label="Telegram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h6 className="text-[var(--accent-primary)] mb-4 font-mono text-sm">
                &gt; NAVIGATE
              </h6>
              <ul className="space-y-2 font-mono text-sm">
                <li>
                  <Link to="/create" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                    // Create Link
                  </Link>
                </li>
                <li>
                  <Link to="/claim" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                    // Claim Funds
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                    // Dashboard
                  </Link>
                </li>
              </ul>
            </div>


            {/* System Info */}
            <div>
              <h6 className="text-[var(--accent-primary)] mb-4 font-mono text-sm">
                &gt; SYS_INFO
              </h6>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-[var(--accent-primary)]">●</span>
                  <span className="text-[var(--text-muted)]">Network: Celo</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-[var(--accent-primary)]">●</span>
                  <span className="text-[var(--text-muted)]">Status: Online</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-[var(--accent-primary)]">●</span>
                  <span className="text-[var(--text-muted)]">Version: 1.0.0</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-[var(--accent-primary)]">●</span>
                  <span className="text-[var(--text-muted)]">Uptime: 99.9%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[var(--border-primary)] pt-8">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
              <p className="text-[var(--text-dim)] text-xs font-mono">
                © {new Date().getFullYear()} PAYLINK_PROTOCOL // ALL_RIGHTS_RESERVED
              </p>
              <div className="flex gap-6 text-xs font-mono">
                <a href="#" className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors">
                  PRIVACY_POLICY
                </a>
                <a href="#" className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors">
                  TERMS_OF_SERVICE
                </a>
                <a href="#" className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors">
                  LICENSE
                </a>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
