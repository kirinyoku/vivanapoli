'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Utensils, 
  ClipboardList, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('viva-admin-token') : null;
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else if (token || pathname === '/admin/login') {
      setAuthorized(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('viva-admin-token');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-primary animate-pulse font-heading text-2xl">Laster portal...</div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Menystyring', href: '/admin/menu', icon: Utensils },
    { label: 'Bestillinger', href: '/admin/orders', icon: ClipboardList },
    { label: 'Innstillinger', href: '/admin/settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#1a1a1a] text-white">
      <div className="p-8">
        <Link href="/admin" className="font-heading text-2xl font-bold tracking-tighter transition-opacity hover:opacity-80">
          Viva<span className="text-primary italic">Napoli</span>
          <span className="ml-2 text-[10px] font-bold tracking-widest uppercase text-accent-gold block mt-1 opacity-60">Admin Portal</span>
        </Link>
      </div>

      <nav className="flex-grow px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-500 group-hover:text-white')} />
              {item.label}
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-gold shadow-[0_0_8px_rgba(197,160,89,0.6)]" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 space-y-2 border-t border-white/5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold tracking-widest uppercase text-gray-500 hover:bg-white/5 hover:text-white transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          Se Nettside
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Logg ut
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      {/* Mobile Top Nav */}
      <div className="lg:hidden flex items-center justify-between bg-[#1a1a1a] text-white px-6 h-16 sticky top-0 z-50">
        <Logo className="text-xl text-white" />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 lg:block z-30 border-r border-border-light/40 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        "lg:ml-72 p-6 lg:p-10"
      )}>
        <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
