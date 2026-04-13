'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

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
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-4">
      <div className="w-full max-w-lg space-y-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-12 group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted hover:text-primary transition-all">
            <ArrowLeft size={12} /> Tilbake til nettsiden
          </Link>
          
          <div className="mb-4 flex items-center gap-3">
            <div className="h-[1px] w-8 bg-accent-gold" />
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-text-muted opacity-40">Admin Portal</span>
            <div className="h-[1px] w-8 bg-accent-gold" />
          </div>
          
          <Logo className="text-5xl" />
          <p className="mt-4 text-text-muted italic opacity-80">
            Logg inn for å administrere restauranten.
          </p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-black/[0.04] ring-1 ring-border-light/60 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          
          <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center gap-3 animate-in shake duration-500">
                <div className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-red-600 shadow-sm text-xs font-bold">!</div>
                <p className="text-xs font-bold text-red-900 uppercase tracking-wider">{error}</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 px-1">E-postadresse</label>
                <div className="relative group">
                  <input
                    type="email"
                    required
                    className="w-full rounded-2xl border border-border-light/60 bg-bg-page/50 p-4 pl-12 shadow-inner transition-all outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary"
                    placeholder="navn@eksempel.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted opacity-30 group-focus-within:text-primary transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 px-1">Passord</label>
                <div className="relative group">
                  <input
                    type="password"
                    required
                    className="w-full rounded-2xl border border-border-light/60 bg-bg-page/50 p-4 pl-12 shadow-inner transition-all outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted opacity-30 group-focus-within:text-primary transition-all" />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-2xl py-7 text-lg font-bold tracking-[0.2em] uppercase shadow-2xl shadow-primary/20 active:scale-95 transition-all"
            >
              {loading ? 'Logger inn...' : 'Logg inn'}
            </Button>
          </form>
        </div>
        
        <p className="text-center text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] opacity-30">
          © 2026 Viva Napoli — Utviklet for profesjonell drift
        </p>
      </div>
    </div>
  );
}
