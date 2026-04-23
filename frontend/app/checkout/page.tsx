'use client';

/**
 * Checkout page – where customers enter their details and place an order.
 *
 * This is a client‑side component because it manages form state, interacts with
 * the cart store, and submits orders to the backend. It also handles real‑time
 * validation, shop‑status checks, and error feedback.
 *
 * The page is designed to be a single‑step checkout: customer information,
 * order type (delivery/pickup), and payment method (cash on delivery only).
 */
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
        <div className="text-primary font-heading animate-pulse text-2xl">
          Laster checkout...
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="bg-bg-page flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="ring-border-light mb-8 rounded-full bg-white p-12 shadow-2xl ring-1 shadow-black/5">
          <ShoppingBag className="text-primary h-20 w-20 opacity-20" />
        </div>
        <h1 className="font-heading text-text-dark mb-4 text-4xl font-semibold italic">
          Kurven din er tom
        </h1>
        <p className="text-text-muted mb-10 max-w-md text-lg leading-relaxed italic opacity-80">
          Det ser ut som du ikke har lagt til noe smakfullt ennå. Våре pizzaer
          venter på deg!
        </p>
        <Link href="/">
          <Button
            size="lg"
            className="shadow-primary/20 rounded-2xl px-16 py-7 shadow-xl active:scale-95"
          >
            Gå til menyen
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
      router.push(`/order/success?type=${formData.order_type}`);
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
      <header className="border-border-light/60 sticky top-0 z-40 border-b bg-white/80 px-4 py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="text-text-muted hover:text-primary group flex items-center gap-3 transition-all"
          >
            <div className="border-border-light group-hover:border-primary flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition-all group-hover:shadow-md">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="hidden text-[10px] font-bold tracking-[0.2em] uppercase sm:inline">
              Tilbake til meny
            </span>
          </Link>
          <div className="font-heading text-text-dark text-3xl font-semibold tracking-tighter">
            Viva<span className="text-primary italic">Napoli</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="bg-accent-gold h-1.5 w-1.5 rounded-full" />
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">
              Checkout
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 md:px-8 lg:py-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* Main Form Area */}
          <div className="space-y-10 lg:col-span-7">
            <header>
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-accent-gold h-1 w-12 rounded-full" />
                <h1 className="font-heading text-text-dark text-5xl leading-tight font-semibold">
                  Checkout
                </h1>
              </div>
              <p className="text-text-muted text-lg italic opacity-80">
                Fullfør bestillingen din ved å fylle ut detaljene nedenfor.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Kontakt */}
              <section className="ring-border-light/60 rounded-3xl bg-white p-6 shadow-xl ring-1 shadow-black/[0.02] transition-all hover:shadow-black/[0.04] md:p-10">
                <div className="mb-10 flex items-center gap-4">
                  <div className="bg-primary shadow-primary/20 flex h-10 w-10 shrink-0 rotate-3 items-center justify-center rounded-2xl font-bold text-white shadow-lg">
                    1
                  </div>
                  <div>
                    <h2 className="text-text-dark text-2xl font-bold tracking-tight">
                      Hvem bestiller?
                    </h2>
                    <p className="text-text-muted text-xs font-medium italic opacity-60">
                      Din kontaktinformasjon
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label
                      htmlFor="customer_name"
                      className="text-text-muted px-1 text-[10px] font-bold tracking-[0.15em] uppercase"
                    >
                      Fullt navn
                    </label>
                    <input
                      type="text"
                      id="customer_name"
                      name="customer_name"
                      autoComplete="name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder="Ola Nordmann"
                      className={cn(
                        'bg-bg-page/50 w-full rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4',
                        fieldErrors.customer_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                          : 'border-border-light/60 focus:ring-primary/5 focus:border-primary'
                      )}
                    />
                    {fieldErrors.customer_name && (
                      <p className="mt-1 px-1 text-[10px] font-bold tracking-wider text-red-500 uppercase">
                        {fieldErrors.customer_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label
                      htmlFor="customer_phone"
                      className="text-text-muted px-1 text-[10px] font-bold tracking-[0.15em] uppercase"
                    >
                      Mobilnummer
                    </label>
                    <input
                      type="tel"
                      id="customer_phone"
                      name="customer_phone"
                      autoComplete="tel"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="90 00 00 00"
                      className={cn(
                        'bg-bg-page/50 w-full rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4',
                        fieldErrors.customer_phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                          : 'border-border-light/60 focus:ring-primary/5 focus:border-primary'
                      )}
                    />
                    {fieldErrors.customer_phone && (
                      <p className="mt-1 px-1 text-[10px] font-bold tracking-wider text-red-500 uppercase">
                        {fieldErrors.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Step 2: Levering */}
              <section className="ring-border-light/60 rounded-3xl bg-white p-6 shadow-xl ring-1 shadow-black/[0.02] transition-all hover:shadow-black/[0.04] md:p-10">
                <div className="mb-10 flex items-center gap-4">
                  <div className="bg-primary shadow-primary/20 flex h-10 w-10 shrink-0 -rotate-3 items-center justify-center rounded-2xl font-bold text-white shadow-lg">
                    2
                  </div>
                  <div>
                    <h2 className="text-text-dark text-2xl font-bold tracking-tight">
                      Hvordan vil du få maten?
                    </h2>
                    <p className="text-text-muted text-xs font-medium italic opacity-60">
                      Velg leveringsmetode
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        order_type: 'delivery',
                      }))
                    }
                    className={cn(
                      'group relative flex cursor-pointer flex-col items-center gap-5 rounded-[2.5rem] border-2 p-8 transition-all duration-300',
                      formData.order_type === 'delivery'
                        ? 'border-primary bg-primary/[0.02] shadow-primary/5 scale-[1.02] shadow-xl'
                        : 'border-border-light/40 text-text-muted hover:border-primary/20 bg-white/50 hover:bg-white'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl p-4 transition-all duration-300',
                        formData.order_type === 'delivery'
                          ? 'bg-primary shadow-primary/30 text-white shadow-lg'
                          : 'bg-bg-page text-text-muted'
                      )}
                    >
                      <Truck className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span
                        className={cn(
                          'mb-1 block text-sm font-bold tracking-[0.2em] uppercase',
                          formData.order_type === 'delivery'
                            ? 'text-primary'
                            : ''
                        )}
                      >
                        Levering
                      </span>
                      <span className="block text-[11px] leading-tight font-medium italic opacity-60">
                        Kjøres hjem til deg
                      </span>
                    </div>
                    {formData.order_type === 'delivery' && (
                      <div className="bg-primary absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        order_type: 'pickup',
                      }));
                      setFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.customer_address;
                        return n;
                      });
                    }}
                    className={cn(
                      'group relative flex cursor-pointer flex-col items-center gap-5 rounded-[2.5rem] border-2 p-8 transition-all duration-300',
                      formData.order_type === 'pickup'
                        ? 'border-primary bg-primary/[0.02] shadow-primary/5 scale-[1.02] shadow-xl'
                        : 'border-border-light/40 text-text-muted hover:border-primary/20 bg-white/50 hover:bg-white'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl p-4 transition-all duration-300',
                        formData.order_type === 'pickup'
                          ? 'bg-primary shadow-primary/30 text-white shadow-lg'
                          : 'bg-bg-page text-text-muted'
                      )}
                    >
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span
                        className={cn(
                          'mb-1 block text-sm font-bold tracking-[0.2em] uppercase',
                          formData.order_type === 'pickup' ? 'text-primary' : ''
                        )}
                      >
                        Henting
                      </span>
                      <span className="block text-[11px] leading-tight font-medium italic opacity-60">
                        Du henter selv
                      </span>
                    </div>
                    {formData.order_type === 'pickup' && (
                      <div className="bg-primary absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full" />
                    )}
                  </button>
                </div>

                {formData.order_type === 'delivery' && (
                  <div className="animate-in fade-in slide-in-from-top-4 mt-10 duration-500">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label
                          htmlFor="customer_address"
                          className="text-text-muted px-1 text-[10px] font-bold tracking-[0.15em] uppercase"
                        >
                          Leveringsadresse
                        </label>
                        <input
                          type="text"
                          id="customer_address"
                          name="customer_address"
                          autoComplete="street-address"
                          value={formData.customer_address}
                          onChange={handleInputChange}
                          placeholder="Gateadresse, postnummer og sted"
                          className={cn(
                            'bg-bg-page/50 w-full rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4',
                            fieldErrors.customer_address
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                              : 'border-border-light/60 focus:ring-primary/5 focus:border-primary'
                          )}
                        />
                        {fieldErrors.customer_address && (
                          <p className="mt-1 px-1 text-[10px] font-bold tracking-wider text-red-500 uppercase">
                            {fieldErrors.customer_address}
                          </p>
                        )}
                      </div>

                      {/* Delivery Info Notice */}
                      <div className="bg-bg-page/50 border-border-light/40 flex items-start gap-4 rounded-2xl border p-6">
                        <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                          <Truck className="text-primary h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-text-dark text-[10px] font-bold tracking-wider uppercase">
                            Leveringsinformasjon
                          </h4>
                          <p className="text-text-muted text-xs leading-relaxed italic opacity-80">
                            Normal leveringstid er innen 60 minutter. Ved stor
                            pågang eller vanskelige adresser kan det ta noe
                            lenger tid. Det gis ingen rabatt ved forsinkelser.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Step 3: Beskjed */}
              <section className="ring-border-light/60 rounded-3xl bg-white p-6 shadow-xl ring-1 shadow-black/[0.02] transition-all hover:shadow-black/[0.04] md:p-10">
                <div className="mb-10 flex items-center gap-4">
                  <div className="bg-primary shadow-primary/20 flex h-10 w-10 shrink-0 rotate-12 items-center justify-center rounded-2xl font-bold text-white shadow-lg">
                    3
                  </div>
                  <div>
                    <h2 className="text-text-dark text-2xl font-bold tracking-tight">
                      Siste detaljer
                    </h2>
                    <p className="text-text-muted text-xs font-medium italic opacity-60">
                      Merknad og betaling
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label
                      htmlFor="comment"
                      className="text-text-muted px-1 text-[10px] font-bold tracking-[0.15em] uppercase"
                    >
                      Beskjed (valgfri)
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={3}
                      value={formData.comment}
                      onChange={handleInputChange}
                      placeholder="Dørkode, allergier eller andre ønsker..."
                      className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full resize-none rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4"
                    />
                  </div>

                  <div className="bg-primary/5 ring-primary/10 relative overflow-hidden rounded-2xl p-8 ring-1">
                    <div className="text-primary absolute -top-4 -right-4 opacity-5">
                      <CreditCard className="h-24 w-24 rotate-12" />
                    </div>
                    <div className="relative flex items-start gap-5">
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <CreditCard className="text-primary h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-text-dark leading-none font-bold">
                          Betalingsinformasjon
                        </h3>
                        <p className="text-text-muted text-sm leading-relaxed italic opacity-80">
                          Bestillingen betales direkte ved levering/henting. Vi
                          aksepterer{' '}
                          <span className="text-primary font-bold">
                            Kort, Kontant og Vipps.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {generalError && (
                <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-6 ring-1 ring-red-100">
                  <span className="text-xl">⚠️</span>
                  <p className="font-bold text-red-900">{generalError}</p>
                </div>
              )}
            </form>
          </div>

          {/* Sidebar: Order Summary */}
          <aside className="lg:col-span-5">
            <div className="sticky top-32">
              <div className="ring-border-light/60 rounded-[2.5rem] bg-white p-8 shadow-2xl ring-1 shadow-black/[0.04] md:p-10">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="font-heading text-text-dark text-4xl font-semibold">
                    Din Bestilling
                  </h2>
                  <div className="bg-bg-page flex h-10 w-10 items-center justify-center rounded-full">
                    <ShoppingBag className="text-primary h-5 w-5" />
                  </div>
                </div>

                <ul className="custom-scrollbar mb-10 max-h-[45vh] space-y-6 overflow-y-auto pr-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="group flex justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-primary text-sm font-black italic">
                            x{item.quantity}
                          </span>
                          <span className="text-text-dark group-hover:text-primary leading-tight font-bold transition-colors">
                            {item.name}
                          </span>
                        </div>
                        {item.size && (
                          <span className="text-text-muted ml-6 block text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">
                            {item.size === 'large' ? 'Stor' : 'Liten'}
                          </span>
                        )}
                      </div>
                      <Price
                        amount={item.price * item.quantity}
                        className="text-text-dark font-bold whitespace-nowrap"
                      />
                    </li>
                  ))}
                </ul>

                <div className="border-border-light/60 space-y-4 border-t-2 border-dashed pt-8">
                  <div className="flex items-center justify-between opacity-60">
                    <span className="text-[10px] font-bold tracking-widest uppercase">
                      Subtotal
                    </span>
                    <Price amount={totalPrice} className="text-sm font-bold" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                      Levering
                    </span>
                    <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
                      Gratis
                    </span>
                  </div>

                  <div className="flex items-end justify-between pt-6">
                    <div>
                      <span className="text-text-muted mb-1 block text-[10px] font-bold tracking-widest uppercase opacity-40">
                        Total å betale
                      </span>
                      <span className="font-heading text-text-dark text-4xl leading-none font-semibold">
                        Total
                      </span>
                    </div>
                    <Price
                      amount={totalPrice}
                      className="text-primary text-4xl leading-none"
                    />
                  </div>
                </div>

                {/* Important: Shop Status Notification before Button */}
                {isClosed && (
                  <div className="mt-8 flex items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50/50 p-6 ring-1 ring-amber-100">
                    <span className="text-2xl drop-shadow-sm">🌙</span>
                    <div className="space-y-1">
                      <p className="text-sm leading-tight font-bold text-amber-900">
                        Vi har dessverre stengt nå
                      </p>
                      <p className="text-[11px] leading-tight font-medium text-amber-800/80 italic">
                        {shopStatus?.message}. Velkommen tilbake ved åpning!
                      </p>
                    </div>
                  </div>
                )}

                <div className="hidden pt-10 lg:block">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    disabled={isSubmitting || isClosed}
                    className={cn(
                      'w-full rounded-[2rem] py-8 text-lg font-bold tracking-[0.1em] shadow-2xl transition-all active:scale-95',
                      isClosed
                        ? 'bg-text-muted/10 text-text-muted/40 border-border-light/20 cursor-not-allowed border shadow-none grayscale'
                        : 'shadow-primary/30'
                    )}
                  >
                    {isClosed
                      ? 'Vi har stengt'
                      : isSubmitting
                        ? 'Sender bestilling...'
                        : 'Bekreft Bestilling'}
                  </Button>
                </div>

                {/* Mobile CTA */}
                <div className="pt-8 lg:hidden">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    disabled={isSubmitting || isClosed}
                    className={cn(
                      'w-full rounded-[2rem] py-8 text-lg font-bold tracking-widest shadow-2xl transition-all active:scale-95',
                      isClosed
                        ? 'bg-text-muted/10 text-text-muted/40 border-border-light/20 cursor-not-allowed border shadow-none grayscale'
                        : 'shadow-primary/30'
                    )}
                  >
                    {isClosed
                      ? 'Vi har stengt'
                      : isSubmitting
                        ? 'Behandler...'
                        : `Fullfør Bestilling — ${totalPrice},-`}
                  </Button>
                </div>

                <div className="border-border-light/40 mt-10 border-t pt-10">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="mb-2 text-[10px] font-bold tracking-widest uppercase opacity-30">
                        Vipps
                      </span>
                      <div className="bg-bg-page flex h-8 w-12 items-center justify-center rounded opacity-40 grayscale transition-all group-hover:grayscale-0">
                        <span className="text-xs font-black">V</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="mb-2 text-[10px] font-bold tracking-widest uppercase opacity-30">
                        Kort
                      </span>
                      <div className="bg-bg-page flex h-8 w-12 items-center justify-center rounded opacity-40 grayscale transition-all">
                        <CreditCard className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <p className="text-text-muted mt-8 text-center text-[10px] leading-relaxed font-bold tracking-wider uppercase italic opacity-40">
                    Spørsmål? Ring oss: {settings?.phone || '90 89 77 77'}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
