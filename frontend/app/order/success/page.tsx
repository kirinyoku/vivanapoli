'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Phone, ShoppingBag, Clock, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { RestaurantSettings } from '@/types';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderType = searchParams.get('type') || 'delivery';
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const isPickup = orderType === 'pickup';
  const timeInfo = isPickup 
    ? "Klar om ca. 20-30 minutter" 
    : `Forventet levering: ${settings?.delivery_time || '30-60 min'}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-page p-6 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 duration-[2s]"></div>
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-primary text-white shadow-2xl shadow-primary/40 rotate-6">
              <CheckCircle2 className="h-14 w-14 -rotate-6" />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-1 w-8 bg-accent-gold rounded-full" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">Bestilling Mottatt</span>
            <div className="h-1 w-8 bg-accent-gold rounded-full" />
          </div>
          <h1 className="font-heading text-6xl font-semibold text-text-dark leading-tight">
            Takk for din bestilling!
          </h1>
          <p className="text-xl text-text-muted italic opacity-80 max-w-md mx-auto">
            Vi har mottatt ordren din og våre kokker er allerede i gang med forberedelsene.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mb-16">
          {/* Confirmation Box */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-black/[0.03] ring-1 ring-border-light/60 transition-all hover:shadow-black/[0.06] flex flex-col items-center text-center">
            <div className="mb-6 h-14 w-14 flex items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-inner">
              <Phone className="h-7 w-7" />
            </div>
            <h3 className="mb-3 font-bold text-text-dark uppercase tracking-widest text-[10px] opacity-40">Status</h3>
            <p className="text-sm font-medium text-text-muted leading-relaxed italic px-4">
              Vi kontakter deg på telefon dersom vi trenger flere opplysninger.
            </p>
          </div>

          {/* Time Info Box */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-black/[0.03] ring-1 ring-border-light/60 transition-all hover:shadow-black/[0.06] flex flex-col items-center text-center border-b-4 border-b-accent-gold/20">
            <div className="mb-6 h-14 w-14 flex items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-inner">
              <Clock className="h-7 w-7" />
            </div>
            <h3 className="mb-3 font-bold text-text-dark uppercase tracking-widest text-[10px] opacity-40">
              {isPickup ? 'Hentetid' : 'Leveringstid'}
            </h3>
            <p className="text-sm font-bold text-primary leading-relaxed px-4">
              {timeInfo}
            </p>
          </div>
        </div>

        {isPickup && settings && (
          <div className="mb-12 rounded-3xl bg-primary/5 p-6 ring-1 ring-primary/10 animate-in fade-in zoom-in duration-700">
             <div className="flex items-center justify-center gap-3 text-primary mb-2">
                <MapPin className="h-5 w-5" />
                <span className="font-bold text-sm uppercase tracking-widest">Hentes hos</span>
             </div>
             <p className="text-text-dark font-heading text-2xl font-semibold">{settings.address}</p>
          </div>
        )}

        <div className="space-y-6 max-w-sm mx-auto">
          <Link href="/" className="block">
            <Button size="lg" className="w-full rounded-2xl py-7 shadow-2xl shadow-primary/20 text-lg tracking-widest active:scale-95 transition-all">
              Gå til forsiden
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="h-px flex-grow bg-border-light/60"></div>
            <ShoppingBag className="h-5 w-5 text-accent-gold opacity-40" />
            <div className="h-px flex-grow bg-border-light/60"></div>
          </div>

          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] opacity-40 italic">
            Buon appetito fra alle oss på Viva Napoli
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-primary animate-pulse font-heading text-2xl">Laster...</div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
