import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProvider from "@/components/app-provider";
import { AuthProvider } from "@/context/auth-context";
import Navbar from "@/components/navbar";
import LayoutGuard from "@/components/auth-guard";
import { ToastContainer } from 'react-toastify';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paylink Celo",
  description: "A simple way to receive payments on the Celo blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          <AuthProvider>
            <Navbar />
            <LayoutGuard>
              {children}
            </LayoutGuard>
          </AuthProvider>
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
