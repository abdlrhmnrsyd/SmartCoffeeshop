'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, Coffee, Layers, Table, Users, 
  Ticket, BarChart3, Settings, ClipboardList, 
  History, Clock, LogOut, Menu, X, Bell 
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const role = (session?.user as any)?.role || 'CUSTOMER';
  const userName = session?.user?.name || 'User';

  // Define sidebar menu options based on role
  const adminItems: SidebarItem[] = [
    { name: 'Statistics', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Coffee },
    { name: 'Categories', href: '/admin/categories', icon: Layers },
    { name: 'Tables & QR', href: '/admin/tables', icon: Table },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Vouchers & Promos', href: '/admin/vouchers', icon: Ticket },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Shop Settings', href: '/admin/settings', icon: Settings },
  ];

  const cashierItems: SidebarItem[] = [
    { name: 'Point of Sale', href: '/cashier', icon: Coffee },
    { name: 'Customer Orders', href: '/cashier/orders', icon: ClipboardList },
    { name: 'Shift Register', href: '/cashier/shift', icon: Clock },
    { name: 'Transactions', href: '/cashier/history', icon: History },
  ];

  const baristaItems: SidebarItem[] = [
    { name: 'Drink Station', href: '/barista', icon: ClipboardList },
  ];

  let menuItems: SidebarItem[] = [];
  if (role === 'ADMIN') {
    menuItems = adminItems;
  } else if (role === 'CASHIER') {
    menuItems = cashierItems;
  } else if (role === 'BARISTA') {
    menuItems = baristaItems;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border p-4 text-card-foreground">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">Smart Coffee</h1>
            <p className="text-xs text-muted-foreground capitalize font-medium">{role.toLowerCase()} Panel</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 py-6 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Information and Sign Out */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logged in as</p>
          <h4 className="text-sm font-bold truncate mt-0.5">{userName}</h4>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-accent text-accent-foreground mt-1 uppercase">
            {role}
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="md:hidden flex items-center justify-between bg-card text-card-foreground border-b border-border px-4 py-3 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Coffee className="h-5 w-5" />
          </div>
          <span className="font-bold text-sm">Smart Coffee</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Drawer (AnimatePresence) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-card z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 z-30 shadow-sm">
        <SidebarContent />
      </aside>
    </>
  );
}
