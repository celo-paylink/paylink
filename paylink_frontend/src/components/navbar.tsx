import { useState } from 'react'
import CustomConnectButton from './connect-wallet-btn'
import { NavLink } from 'react-router'
import { Link as LinkIcon, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMenu = () => setIsMobileMenuOpen(false)

  const navLinks = [
    { to: '/create', label: 'Create' },
    { to: '/claim', label: 'Claim' },
    { to: '/reclaim', label: 'Reclaim' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--border-subtle)]">
      <div className="container">
        <div className="flex justify-between items-center py-4 md:py-5">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--gradient-purple)] to-[var(--gradient-cyan)]">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text group-hover:opacity-90 transition-opacity">
              Paylink
            </h1>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-all hover:text-[var(--accent-green)] ${isActive ? 'text-[var(--accent-green)]' : 'text-[var(--text-secondary)]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Wallet Connect Button - Desktop */}
            <div className="hidden md:block">
              <CustomConnectButton />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-[var(--text-secondary)] hover:text-white transition-colors"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border-subtle)] animate-in slide-in-from-top-2 fade-in duration-200">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                      ? 'bg-[rgba(0,255,157,0.1)] text-[var(--accent-green)]'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {/* Wallet Connect Button - Mobile */}
              <div className="px-4 pt-2">
                <CustomConnectButton mobile={true} />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
