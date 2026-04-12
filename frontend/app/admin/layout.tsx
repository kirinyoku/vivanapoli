'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('viva-admin-token');
    // Only redirect if on login page or no token
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
      <div className="flex min-h-screen items-center justify-center">
        <p>Laster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/admin"
                className="cursor-pointer text-xl font-bold text-red-600 transition-colors duration-200 hover:text-red-700"
              >
                Viva Napoli Admin
              </Link>
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/admin"
                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/menu"
                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
                >
                  Meny
                </Link>
                <Link
                  href="/admin/orders"
                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
                >
                  Bestillinger
                </Link>
                <Link
                  href="/admin/settings"
                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
                >
                  Innstillinger
                </Link>
              </div>
            </div>
            <div>
              <button
                onClick={handleLogout}
                className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
              >
                Logg ut
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
