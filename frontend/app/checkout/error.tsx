'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function CheckoutError({
  error,
  reset,
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
        Noe gikk galt på checkout
      </h1>
      <p className="text-text-muted mb-10 max-w-md text-lg italic opacity-80">
        Vi beklager, men det oppsto en feil under lastingen av checkout-siden.
      </p>
      <Button
        onClick={() => reset()}
        size="lg"
        className="rounded-2xl px-12 py-6"
      >
        Prøv igjen
      </Button>
    </div>
  );
}
