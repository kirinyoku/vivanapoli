'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ShoppingBag, Truck } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Price from '@/components/ui/Price';
import { cn } from '@/lib/utils';
import { CreateOrderRequest, OrderType } from '@/types';

import { getShopStatus } from '@/lib/opening-hours';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const totalPrice = getTotalPrice();

  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    api
      .getSettings()
      .then((data) => {
        setSettings(data);
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    order_type: 'delivery' as OrderType,
    comment: '',
  });

  const shopStatus =
    mounted && settings
      ? getShopStatus(
          settings.open_time,
          settings.close_time,
          settings.is_open === 'false'
        )
      : mounted
        ? getShopStatus()
        : null;
  const isClosed = shopStatus?.status === 'closed';

  if (!mounted) {
    return (
      <div className="bg-bg-page flex min-h-screen items-center justify-center">
        <div className="text-text-muted animate-pulse">Laster...</div>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="bg-bg-page flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="mb-6 rounded-full bg-white p-8 shadow-sm">
          <ShoppingBag className="text-text-muted h-16 w-16 opacity-20" />
        </div>
        <h1 className="font-heading text-text-dark mb-2 text-3xl font-semibold">
          Kurven er tom
        </h1>
        <p className="text-text-muted mb-8 max-w-md italic">
          Du har ingen varer i kurven. Gå tilbake til menyen for å legge til noe
          godt.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-2xl px-12">
            Se menyen
          </Button>
        </Link>
      </div>
    );
  }

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      errors.customer_name = 'Navn er obligatorisk';
    }

    const phoneDigits = formData.customer_phone.replace(/\s/g, '');
    const phoneRegex = /^[0-9]{8}$/;
    if (!formData.customer_phone.trim()) {
      errors.customer_phone = 'Telefonnummer er obligatorisk';
    } else if (!phoneRegex.test(phoneDigits)) {
      errors.customer_phone =
        'Vennligst oppgi et gyldig telefonnummer (8 siffer)';
    }

    if (
      formData.order_type === 'delivery' &&
      !formData.customer_address.trim()
    ) {
      errors.customer_address = 'Leveringsadresse er obligatorisk';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const orderRequest: CreateOrderRequest = {
        ...formData,
        items: items.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          size: item.size || 'large',
        })),
      };

      await api.placeOrder(orderRequest);
      clearCart();
      router.push('/order/success');
    } catch (err: any) {
      setGeneralError(err.message || 'Noe gikk galt. Vennligst prøv igjen.');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="bg-bg-page flex min-h-screen flex-col">
      <header className="border-border-light sticky top-0 z-10 border-b bg-white px-4 py-4 shadow-sm md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-text-muted hover:text-text-dark group flex cursor-pointer items-center gap-2 transition-colors duration-200"
          >
            <div className="border-border-light group-hover:border-text-muted flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white transition-all duration-200 group-hover:shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="hidden text-xs font-bold tracking-wider uppercase sm:inline">
              Meny
            </span>
          </Link>
          <div className="font-heading text-text-dark text-3xl font-semibold">
            Viva<span className="text-primary">Napoli</span>
          </div>
          <div className="w-10 sm:w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-grow px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-5">
          {/* Form Section */}
          <div className="space-y-12 lg:col-span-3">
            <div>
              <h1 className="font-heading text-text-dark mb-4 text-5xl font-semibold">
                Din Bestilling
              </h1>
              <p className="text-text-muted italic">
                Vennligst oppgi informasjon for å fullføре bestillingen.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full font-bold">
                    1
                  </div>
                  <h2 className="text-text-dark text-2xl font-bold">
                    Kontaktinfo
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label
                      htmlFor="customer_name"
                      className="text-text-muted cursor-default text-xs font-bold tracking-[0.15em] uppercase"
                    >
                      Navn
                    </label>
                    <input
                      type="text"
                      id="customer_name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder="Ditt navn"
                      className={cn(
                        'hover:border-text-muted/30 w-full cursor-text rounded-2xl border bg-white p-4 shadow-sm transition-all outline-none focus:ring-4',
                        fieldErrors.customer_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                          : 'border-border-light focus:ring-primary/5 focus:border-primary'
                      )}
                    />
                    {fieldErrors.customer_name && (
                      <p className="mt-1 text-xs font-bold text-red-500">
                        {fieldErrors.customer_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label
                      htmlFor="customer_phone"
                      className="text-text-muted cursor-default text-xs font-bold tracking-[0.15em] uppercase"
                    >
                      Telefon
                    </label>
                    <input
                      type="tel"
                      id="customer_phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="8 siffer"
                      className={cn(
                        'hover:border-text-muted/30 w-full cursor-text rounded-2xl border bg-white p-4 shadow-sm transition-all outline-none focus:ring-4',
                        fieldErrors.customer_phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                          : 'border-border-light focus:ring-primary/5 focus:border-primary'
                      )}
                    />
                    {fieldErrors.customer_phone && (
                      <p className="mt-1 text-xs font-bold text-red-500">
                        {fieldErrors.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full font-bold">
                    2
                  </div>
                  <h2 className="text-text-dark text-2xl font-bold">
                    Levering eller henting?
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        order_type: 'delivery',
                      }));
                      if (fieldErrors.customer_address) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.customer_address;
                          return newErrors;
                        });
                      }
                    }}
                    className={cn(
                      'group relative flex cursor-pointer flex-col items-center gap-4 overflow-hidden rounded-3xl border-2 p-8 transition-all duration-200',
                      formData.order_type === 'delivery'
                        ? 'border-primary shadow-primary/10 bg-white shadow-xl'
                        : 'border-border-light text-text-muted hover:border-text-muted/30 bg-white/50 hover:bg-white hover:shadow-md'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl p-4 transition-all duration-200',
                        formData.order_type === 'delivery'
                          ? 'bg-primary text-white'
                          : 'text-text-muted group-hover:text-primary/80 bg-black/5 group-hover:bg-black/10'
                      )}
                    >
                      <Truck className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span
                        className={cn(
                          'mb-1 block text-sm font-bold tracking-widest uppercase',
                          formData.order_type === 'delivery'
                            ? 'text-primary'
                            : ''
                        )}
                      >
                        Levering
                      </span>
                      <span className="text-xs opacity-60">
                        Vi leverer hjem til deg
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        order_type: 'pickup',
                      }));
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.customer_address;
                        return newErrors;
                      });
                    }}
                    className={cn(
                      'group relative flex cursor-pointer flex-col items-center gap-4 overflow-hidden rounded-3xl border-2 p-8 transition-all duration-200',
                      formData.order_type === 'pickup'
                        ? 'border-primary shadow-primary/10 bg-white shadow-xl'
                        : 'border-border-light text-text-muted hover:border-text-muted/30 bg-white/50 hover:bg-white hover:shadow-md'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl p-4 transition-all duration-200',
                        formData.order_type === 'pickup'
                          ? 'bg-primary text-white'
                          : 'text-text-muted group-hover:text-primary/80 bg-black/5 group-hover:bg-black/10'
                      )}
                    >
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span
                        className={cn(
                          'mb-1 block text-sm font-bold tracking-widest uppercase',
                          formData.order_type === 'pickup' ? 'text-primary' : ''
                        )}
                      >
                        Henting
                      </span>
                      <span className="text-xs opacity-60">
                        Hentes hos oss i restauranten
                      </span>
                    </div>
                  </button>
                </div>

                {formData.order_type === 'delivery' && (
                  <div className="animate-in fade-in slide-in-from-top-4 space-y-3 pt-4 duration-300">
                    <label
                      htmlFor="customer_address"
                      className="text-text-muted cursor-default text-xs font-bold tracking-[0.15em] uppercase"
                    >
                      Adresse (Gateadresse, postnummer, sted)
                    </label>
                    <input
                      type="text"
                      id="customer_address"
                      name="customer_address"
                      value={formData.customer_address}
                      onChange={handleInputChange}
                      placeholder="F.eks. Gamle Hellviksvei 3, 1459 Nesoddtangen"
                      className={cn(
                        'hover:border-text-muted/30 w-full cursor-text rounded-2xl border bg-white p-4 shadow-sm transition-all outline-none focus:ring-4',
                        fieldErrors.customer_address
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                          : 'border-border-light focus:ring-primary/5 focus:border-primary'
                      )}
                    />
                    {fieldErrors.customer_address && (
                      <p className="mt-1 text-xs font-bold text-red-500">
                        {fieldErrors.customer_address}
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full font-bold">
                    3
                  </div>
                  <h2 className="text-text-dark text-2xl font-bold">
                    Merknad & Betaling
                  </h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label
                      htmlFor="comment"
                      className="text-text-muted cursor-default text-xs font-bold tracking-[0.15em] uppercase"
                    >
                      Beskjed til restauranten (valgfri)
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={3}
                      value={formData.comment}
                      onChange={handleInputChange}
                      placeholder="Allergier, dørkode eller andre detaljer..."
                      className="border-border-light focus:ring-primary/5 focus:border-primary hover:border-text-muted/30 w-full cursor-text resize-none rounded-2xl border bg-white p-4 shadow-sm transition-all outline-none focus:ring-4"
                    />
                  </div>

                  <div className="border-border-light group hover:border-primary/30 rounded-2xl border-2 border-dashed bg-white/30 p-8 text-center transition-colors">
                    <div className="text-text-muted group-hover:bg-primary/10 group-hover:text-primary mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/5 transition-colors">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <h3 className="text-text-dark mb-1 font-bold">Betaling</h3>
                    <p className="text-text-muted text-sm italic">
                      Varene betales direkte til oss ved levering eller henting.
                      Vi tar Kort, Kontant og Vipps.
                    </p>
                  </div>
                </div>
              </section>

              {isClosed && (
                <div className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm font-bold text-amber-700 duration-500">
                  <span className="text-xl">🌙</span>
                  <div>
                    <p>{shopStatus?.message}</p>
                    <p className="mt-1 font-normal opacity-80">
                      Vi tar dessverre ikke imot bestillinger akkurat nå.
                      Velkommen tilbake ved åpning!
                    </p>
                  </div>
                </div>
              )}

              {generalError && (
                <div className="animate-pulse rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-600">
                  ⚠️ {generalError}
                </div>
              )}

              <div className="pt-4 lg:hidden">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || isClosed}
                  className={cn(
                    'w-full rounded-2xl py-6 shadow-2xl transition-all active:scale-95',
                    isClosed
                      ? 'bg-text-muted/20 text-text-muted cursor-not-allowed shadow-none'
                      : 'shadow-primary/30'
                  )}
                >
                  {isClosed
                    ? 'Vi har stengt'
                    : isSubmitting
                      ? 'Behandler...'
                      : `Bekreft Bestilling — ${totalPrice},-`}
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-32">
              <div className="border-border-light rounded-[40px] border bg-white p-10 shadow-xl shadow-black/[0.03]">
                <h2 className="font-heading text-text-dark mb-8 text-3xl font-semibold">
                  Din Bestilling
                </h2>

                <div className="custom-scrollbar mb-10 max-h-[40vh] space-y-6 overflow-y-auto pr-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex justify-between gap-4"
                    >
                      <div className="flex flex-col">
                        <span className="text-text-dark group-hover:text-primary leading-tight font-bold transition-colors">
                          {item.quantity}x {item.name}
                        </span>
                        {item.size && (
                          <span className="text-text-muted mt-1 text-[10px] font-bold tracking-[0.2em] uppercase">
                            {item.size === 'large' ? 'Stor' : 'Liten'}
                          </span>
                        )}
                      </div>
                      <Price
                        amount={item.price * item.quantity}
                        className="text-text-dark text-base font-bold whitespace-nowrap"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-border-light space-y-4 border-t-2 pt-8">
                  <div className="text-text-muted flex items-center justify-between">
                    <span className="text-xs font-bold tracking-widest uppercase">
                      Subtotal
                    </span>
                    <Price amount={totalPrice} className="text-sm font-bold" />
                  </div>
                  <div className="text-text-muted flex items-center justify-between">
                    <span className="text-xs font-bold tracking-widest uppercase">
                      Levering
                    </span>
                    {formData.order_type === 'delivery' ? (
                      <span className="text-primary text-xs font-bold tracking-widest uppercase">
                        Gratis
                      </span>
                    ) : (
                      <span className="text-xs font-bold tracking-widest uppercase">
                        —
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between pt-4">
                    <span className="font-heading text-text-dark text-2xl font-semibold">
                      Totalt
                    </span>
                    <Price
                      amount={totalPrice}
                      className="text-primary text-3xl"
                    />
                  </div>
                </div>

                <div className="hidden pt-10 lg:block">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    disabled={isSubmitting || isClosed}
                    className={cn(
                      'w-full rounded-2xl py-6 shadow-2xl transition-all active:scale-95',
                      isClosed
                        ? 'bg-text-muted/20 text-text-muted cursor-not-allowed shadow-none'
                        : 'shadow-primary/30'
                    )}
                  >
                    {isClosed
                      ? 'Vi har stengt'
                      : isSubmitting
                        ? 'Behandler...'
                        : 'Send Bestilling'}
                  </Button>
                </div>

                <div className="text-text-muted mt-8 flex items-center justify-center gap-2 opacity-40">
                  <div className="h-px flex-grow bg-current"></div>
                  <ShoppingBag className="h-4 w-4" />
                  <div className="h-px flex-grow bg-current"></div>
                </div>

                <p className="text-text-muted mt-6 text-center text-[10px] leading-relaxed font-bold tracking-wider uppercase italic opacity-60">
                  Ring oss på {settings?.phone || '90 89 77 77'} om du har
                  spørsmål
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
