import Link from 'next/link'
import CustomConnectButton from './connect-wallet-btn'

export default function Navbar() {
  return (
    <header className="flex justify-between items-center py-4 shadow-sm max-w-5xl mx-auto">
      <h1 className="text-xl font-bold">Paylink</h1>
      <nav className="flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/claim">Claim</Link>
        <Link href="/about">About</Link>
      </nav>
      <CustomConnectButton />
    </header>
  )
}
