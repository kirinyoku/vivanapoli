'use client';

/**
 * Admin layout component.
 *
 * This layout wraps all admin pages (`/admin/*`) and provides:
 * - Route protection based on a token stored in `localStorage`
 * - A responsive sidebar navigation for desktop and mobile
 * - Consistent styling and structure for admin pages
 *
 * The component is client‑side only because it accesses `localStorage` and
 * uses React state for authentication and mobile menu toggling.
 */
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
  X,
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

  /**
   * Authentication effect.
   *
   * Checks for the presence of `viva-admin-token` in `localStorage`. If no token
   * is found and the current route is not the login page, the user is redirected
   * to `/admin/login`. Otherwise, the `authorized` state is set to `true`.
   *
   * The effect runs whenever `pathname` or `router` changes, ensuring that
   * protection is re‑evaluated on navigation.
   */
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('viva-admin-token')
        : null;
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else if (token || pathname === '/admin/login') {
      setAuthorized(true);
    }
  }, [pathname, router]);

  /**
   * Logs the user out by removing the authentication token and redirecting
   * to the admin login page.
   */
  const handleLogout = () => {
    localStorage.removeItem('viva-admin-token');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="bg-bg-page flex min-h-screen items-center justify-center">
        <div className="text-primary font-heading animate-pulse text-2xl">
          Laster portal...
        </div>
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
        <Link
          href="/admin"
          className="font-heading text-2xl font-bold tracking-tighter transition-opacity hover:opacity-80"
        >
          Viva<span className="text-primary italic">Napoli</span>
          <span className="text-accent-gold mt-1 ml-2 block text-[10px] font-bold tracking-widest uppercase opacity-60">
            Admin Portal
          </span>
        </Link>
      </div>

      <nav className="flex-grow space-y-1 px-4">
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
                  ? 'bg-primary shadow-primary/20 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5',
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-white'
                )}
              />
              {item.label}
              {isActive && (
                <div className="bg-accent-gold ml-auto h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(197,160,89,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/5 p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase transition-all hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Se Nettside
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold tracking-widest text-red-400 uppercase transition-all hover:bg-red-500/10"
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
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between bg-[#1a1a1a] px-6 text-white lg:hidden">
        <Logo className="text-xl text-white" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="animate-in slide-in-from-left absolute inset-y-0 left-0 w-72 shadow-2xl duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="border-border-light/40 fixed inset-y-0 left-0 z-30 hidden w-72 border-r shadow-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          'p-6 lg:ml-72 lg:p-10'
        )}
      >
        <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-6xl duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
