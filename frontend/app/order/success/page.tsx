'use client';

/**
 * Order success page – shown after a customer completes the checkout.
 *
 * This page confirms that the order has been received and provides estimated
 * pickup/delivery times. It also displays restaurant contact information and
 * a call‑to‑action to return to the menu.
 *
 * The page reads the `type` query parameter (`delivery` or `pickup`) to adjust
 * the displayed message. It fetches restaurant settings (e.g., delivery time)
 * from the backend to show accurate timing.
 */
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
    ? 'Klar om ca. 20-30 minutter'
    : `Forventet levering: ${settings?.delivery_time || '30-60 min'}`;

  return (
    <div className="bg-bg-page flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full duration-[2s]"></div>
            <div className="bg-primary shadow-primary/40 relative flex h-28 w-28 rotate-6 items-center justify-center rounded-[2.5rem] text-white shadow-2xl">
              <CheckCircle2 className="h-14 w-14 -rotate-6" />
            </div>
          </div>
        </div>

        <div className="mb-12 space-y-4">
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="bg-accent-gold h-1 w-8 rounded-full" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">
              Bestilling Mottatt
            </span>
            <div className="bg-accent-gold h-1 w-8 rounded-full" />
          </div>
          <h1 className="font-heading text-text-dark text-6xl leading-tight font-semibold">
            Takk for din bestilling!
          </h1>
          <p className="text-text-muted mx-auto max-w-md text-xl italic opacity-80">
            Vi har mottatt ordren din og våre kokker er allerede i gang med
            forberedelsene.
          </p>
        </div>

        <div className="mb-16 grid gap-6 sm:grid-cols-2">
          {/* Confirmation Box */}
          <div className="ring-border-light/60 flex flex-col items-center rounded-[2rem] bg-white p-8 text-center shadow-xl ring-1 shadow-black/[0.03] transition-all hover:shadow-black/[0.06]">
            <div className="bg-primary/5 text-primary mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner">
              <Phone className="h-7 w-7" />
            </div>
            <h3 className="text-text-dark mb-3 text-[10px] font-bold tracking-widest uppercase opacity-40">
              Status
            </h3>
            <p className="text-text-muted px-4 text-sm leading-relaxed font-medium italic">
              Vi kontakter deg på telefon dersom vi trenger flere opplysninger.
            </p>
          </div>

          {/* Time Info Box */}
          <div className="ring-border-light/60 border-b-accent-gold/20 flex flex-col items-center rounded-[2rem] border-b-4 bg-white p-8 text-center shadow-xl ring-1 shadow-black/[0.03] transition-all hover:shadow-black/[0.06]">
            <div className="bg-primary/5 text-primary mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner">
              <Clock className="h-7 w-7" />
            </div>
            <h3 className="text-text-dark mb-3 text-[10px] font-bold tracking-widest uppercase opacity-40">
              {isPickup ? 'Hentetid' : 'Leveringstid'}
            </h3>
            <p className="text-primary px-4 text-sm leading-relaxed font-bold">
              {timeInfo}
            </p>
          </div>
        </div>

        {isPickup && settings && (
          <div className="bg-primary/5 ring-primary/10 animate-in fade-in zoom-in mb-12 rounded-3xl p-6 ring-1 duration-700">
            <div className="text-primary mb-2 flex items-center justify-center gap-3">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-bold tracking-widest uppercase">
                Hentes hos
              </span>
            </div>
            <p className="text-text-dark font-heading text-2xl font-semibold">
              {settings.address}
            </p>
          </div>
        )}

        <div className="mx-auto max-w-sm space-y-6">
          <Link href="/" className="block">
            <Button
              size="lg"
              className="shadow-primary/20 w-full rounded-2xl py-7 text-lg tracking-widest shadow-2xl transition-all active:scale-95"
            >
              Gå til forsiden
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-4 py-4">
            <div className="bg-border-light/60 h-px flex-grow"></div>
            <ShoppingBag className="text-accent-gold h-5 w-5 opacity-40" />
            <div className="bg-border-light/60 h-px flex-grow"></div>
          </div>

          <p className="text-text-muted text-[10px] font-bold tracking-[0.3em] uppercase italic opacity-40">
            Buon appetito fra alle oss på Viva Napoli
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-bg-page flex min-h-screen items-center justify-center">
          <div className="text-primary font-heading animate-pulse text-2xl">
            Laster...
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
