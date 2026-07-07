'use client';

import Link from 'next/link';
import { Coffee, ShieldCheck, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Coffee className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Smart Coffee</span>
        </div>
        <Link href="/login">
          <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>Staff Portal</span>
          </button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-accent/30 text-accent-foreground p-4 rounded-3xl mb-6 border border-accent/50 inline-block"
        >
          <Coffee className="h-16 w-16 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
        >
          Welcome to <span className="text-primary">Smart Coffee Shop</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-muted-foreground text-base sm:text-lg mb-8 max-w-lg"
        >
          Scan the QR Code on your table to browse our delicious menu, customize your drinks, place orders, and make payments in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          {/* Customer Entry Mocking Table 5 */}
          <Link href="/menu?table=5" className="flex-1 max-w-xs">
            <div className="h-full bg-card hover:bg-secondary border border-border hover:border-primary/50 p-6 rounded-2xl shadow-xs transition-all duration-300 group cursor-pointer text-left flex flex-col justify-between">
              <div>
                <div className="bg-primary/10 text-primary p-3 rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1">Order at Table 5</h3>
                <p className="text-sm text-muted-foreground">Scan simulator entry. Browse menus, add toppings, order & checkout instantly.</p>
              </div>
              <span className="text-primary text-xs font-semibold uppercase tracking-wider mt-4 inline-block group-hover:translate-x-1 transition-transform">
                Enter Menu &rarr;
              </span>
            </div>
          </Link>

          {/* Cashier / POS Entry */}
          <Link href="/login" className="flex-1 max-w-xs">
            <div className="h-full bg-card hover:bg-secondary border border-border p-6 rounded-2xl shadow-xs transition-all duration-300 group cursor-pointer text-left flex flex-col justify-between">
              <div>
                <div className="bg-primary/10 text-primary p-3 rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1">Staff Access</h3>
                <p className="text-sm text-muted-foreground">Log in to Cashier POS, Barista Station, or Admin Statistics Dashboard.</p>
              </div>
              <span className="text-primary text-xs font-semibold uppercase tracking-wider mt-4 inline-block group-hover:translate-x-1 transition-transform">
                Go to Portal &rarr;
              </span>
            </div>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Smart Coffee Shop Management System. Powered by Next.js 15 & Prisma.</p>
      </footer>
    </div>
  );
}
