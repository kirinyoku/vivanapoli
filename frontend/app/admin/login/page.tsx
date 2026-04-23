'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

/**
 * Admin login page.
 *
 * Provides a simple email/password form for administrators to authenticate.
 * On success, the received JWT token is stored in `localStorage` under
 * `viva-admin-token`, and the user is redirected to the admin dashboard.
 *
 * The token is checked by the parent `AdminLayout` to protect all admin routes.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.login({ email, password });
      localStorage.setItem('viva-admin-token', response.token);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-10">
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="group text-text-muted hover:text-primary mb-12 flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all"
          >
            <ArrowLeft size={12} /> Tilbake til nettsiden
          </Link>

          <div className="mb-4 flex items-center gap-3">
            <div className="bg-accent-gold h-[1px] w-8" />
            <span className="text-text-muted text-[10px] font-black tracking-[0.4em] uppercase opacity-40">
              Admin Portal
            </span>
            <div className="bg-accent-gold h-[1px] w-8" />
          </div>

          <Logo className="text-5xl" />
          <p className="text-text-muted mt-4 italic opacity-80">
            Logg inn for å administrere restauranten.
          </p>
        </div>

        <div className="ring-border-light/60 relative overflow-hidden rounded-[3rem] bg-white p-10 shadow-2xl ring-1 shadow-black/[0.04] md:p-16">
          {/* Decorative background element */}
          <div className="bg-primary/5 absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl" />

          <form className="relative z-10 space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="animate-in shake flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 duration-500">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold text-red-600 shadow-sm">
                  !
                </div>
                <p className="text-xs font-bold tracking-wider text-red-900 uppercase">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-text-muted px-1 text-[10px] font-black tracking-widest uppercase opacity-60">
                  E-postadresse
                </label>
                <div className="group relative">
                  <input
                    type="email"
                    required
                    className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full rounded-2xl border p-4 pl-12 shadow-inner transition-all outline-none focus:ring-4"
                    placeholder="navn@eksempel.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="text-text-muted group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 opacity-30 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-text-muted px-1 text-[10px] font-black tracking-widest uppercase opacity-60">
                  Passord
                </label>
                <div className="group relative">
                  <input
                    type="password"
                    required
                    className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full rounded-2xl border p-4 pl-12 shadow-inner transition-all outline-none focus:ring-4"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="text-text-muted group-focus-within:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 opacity-30 transition-all" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="shadow-primary/20 w-full rounded-2xl py-7 text-lg font-bold tracking-[0.2em] uppercase shadow-2xl transition-all active:scale-95"
            >
              {loading ? 'Logger inn...' : 'Logg inn'}
            </Button>
          </form>
        </div>

        <p className="text-text-muted text-center text-[10px] font-bold tracking-[0.3em] uppercase opacity-30">
          © 2026 Viva Napoli — Utviklet for profesjonell drift
        </p>
      </div>
    </div>
  );
}
