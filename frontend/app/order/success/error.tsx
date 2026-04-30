'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function SuccessError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-bg-page flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 text-6xl">⚠️</div>
      <h1 className="font-heading text-text-dark mb-4 text-4xl font-semibold">
        Klarte ikke å vise ordrebekreftelse
      </h1>
      <p className="text-text-muted mb-10 max-w-md text-lg italic opacity-80">
        Bestillingen din er sannsynligvis mottatt, men vi klarte ikke å vise
        bekreftelsen. Vennligst sjekk mobilen din for SMS eller ring oss.
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-2xl px-12 py-6">
          Tilbake til forsiden
        </Button>
      </Link>
    </div>
  );
}
