import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import React from 'react'
import CustomConnectButton from './connect-wallet-btn'

export default function Navbar() {
  return (
    <header className="flex justify-between items-center px-6 py-4 shadow-sm">
      <h1 className="text-xl font-bold">Paylink</h1>
      <nav className="flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/about">About</Link>
      </nav>
      <CustomConnectButton />
    </header>
  )
}
