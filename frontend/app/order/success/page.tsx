'use client';

import Link from 'next/link';
import { CheckCircle2, Phone, ShoppingBag, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function OrderSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-page p-6 text-center">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/40">
              <CheckCircle2 className="h-12 w-12" />
            </div>
          </div>
        </div>

        <h1 className="mb-4 font-heading text-5xl font-semibold text-text-dark">
          Takk for bestillingen!
        </h1>
        <p className="mb-12 text-lg text-text-muted italic">
          Vi har mottatt din bestilling og startet forberedelsene.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 mb-12">
          <div className="rounded-3xl border border-border-light bg-white p-8 shadow-sm group hover:border-primary transition-colors">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-bold text-text-dark uppercase tracking-widest text-xs">Bekreftelse</h3>
            <p className="text-sm text-text-muted">Vi ringer deg dersom vi har spørsmål om din bestilling.</p>
          </div>

          <div className="rounded-3xl border border-border-light bg-white p-8 shadow-sm group hover:border-primary transition-colors">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-bold text-text-dark uppercase tracking-widest text-xs">Leveringstid</h3>
            <p className="text-sm text-text-muted">Forventet tid er ca. 45-60 minutter i travle perioder.</p>
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/">
            <Button size="lg" className="w-full rounded-2xl py-6 shadow-xl shadow-primary/20">
              Tilbake til forsiden
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-2 text-text-muted opacity-40 py-4">
            <div className="h-px w-8 bg-current"></div>
            <ShoppingBag className="h-4 w-4" />
            <div className="h-px w-8 bg-current"></div>
          </div>

          <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] opacity-60">
            Velkommen igjen til Viva Napoli
          </p>
        </div>
      </div>
    </div>
  );
}
