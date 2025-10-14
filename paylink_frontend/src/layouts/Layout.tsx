import { Home } from 'lucide-react';
import { type ReactNode } from 'react'
import { NavLink } from 'react-router';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center space-x-2">
              <Home className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-white">Vite + Router</span>
            </NavLink>
            <div className="flex space-x-6">
              <NavLink to="/" className="text-white hover:text-blue-600 active:text-red-600 transition">
                Home
              </NavLink>
              <NavLink to="/about" className="text-white hover:text-blue-600 transition">
                About
              </NavLink>
              <NavLink to="/users/john" className="text-white hover:text-blue-600 transition">
                Users
              </NavLink>
              <NavLink to="/dashboard" className="text-white hover:text-blue-600 transition">
                Dashboard
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>React Router Demo in Vite • Built with React & Tailwind</p>
        </div>
      </footer>
    </div>
  );
}
