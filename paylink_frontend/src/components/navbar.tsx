import CustomConnectButton from './connect-wallet-btn'
import { NavLink } from 'react-router'

export default function Navbar() {
  return (
    <header className="flex justify-between items-center py-4 shadow-sm max-w-5xl mx-auto">
      <h1 className="text-xl font-bold">Paylink</h1>
      <nav className="flex gap-4">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/claim">Claim</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <CustomConnectButton />
    </header>
  )
}
