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
        <div className="text-primary animate-pulse font-heading text-2xl">Laster checkout...</div>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="bg-bg-page flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 rounded-full bg-white p-12 shadow-2xl shadow-black/5 ring-1 ring-border-light">
          <ShoppingBag className="text-primary h-20 w-20 opacity-20" />
        </div>
        <h1 className="font-heading text-text-dark mb-4 text-4xl font-semibold italic">
          Kurven din er tom
        </h1>
        <p className="text-text-muted mb-10 max-w-md text-lg leading-relaxed italic opacity-80">
          Det ser ut som du ikke har lagt til noe smakfullt ennå. 
          Våре pizzaer venter på deg!
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-2xl px-16 py-7 shadow-xl shadow-primary/20 active:scale-95">
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
      <header className="border-border-light/60 sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="text-text-muted hover:text-primary group flex items-center gap-3 transition-all"
          >
            <div className="border-border-light flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition-all group-hover:border-primary group-hover:shadow-md">
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
             <div className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
             <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">Checkout</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 md:px-8 lg:py-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          
          {/* Main Form Area */}
          <div className="space-y-10 lg:col-span-7">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-12 bg-accent-gold rounded-full" />
                <h1 className="font-heading text-text-dark text-5xl font-semibold leading-tight">
                  Checkout
                </h1>
              </div>
              <p className="text-text-muted text-lg italic opacity-80">
                Fullfør bestillingen din ved å fylle ut detaljene nedenfor.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Kontakt */}
              <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-black/[0.02] ring-1 ring-border-light/60 transition-all hover:shadow-black/[0.04]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="bg-primary text-white flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold shadow-lg shadow-primary/20 rotate-3">
                    1
                  </div>
                  <div>
                    <h2 className="text-text-dark text-2xl font-bold tracking-tight">
                      Hvem bestiller?
                    </h2>
                    <p className="text-text-muted text-xs font-medium italic opacity-60">Din kontaktinformasjon</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label htmlFor="customer_name" className="text-text-muted text-[10px] font-bold tracking-[0.15em] uppercase px-1">
                      Fullt navn
                    </label>
                    <input
                      type="text"
                      id="customer_name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder="Ola Nordmann"
                      className={cn(
                        'w-full rounded-2xl border bg-bg-page/50 p-4 shadow-inner transition-all outline-none focus:ring-4',
                        fieldErrors.customer_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                          : 'border-border-light/60 focus:ring-primary/5 focus:border-primary'
                      )}
                    />
                    {fieldErrors.customer_name && (
                      <p className="mt-1 text-[10px] font-bold text-red-500 px-1 uppercase tracking-wider">
                        {fieldErrors.customer_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="customer_phone" className="text-text-muted text-[10px] font-bold tracking-[0.15em] uppercase px-1">
                      Mobilnummer
                    </label>
                    <input
                      type="tel"
                      id="customer_phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="90 00 00 00"
                      className={cn(
                        'w-full rounded-2xl border bg-bg-page/50 p-4 shadow-inner transition-all outline-none focus:ring-4',
                        fieldErrors.customer_phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                          : 'border-border-light/60 focus:ring-primary/5 focus:border-primary'
                      )}
                    />
                    {fieldErrors.customer_phone && (
                      <p className="mt-1 text-[10px] font-bold text-red-500 px-1 uppercase tracking-wider">
                        {fieldErrors.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Levering */}
              <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-black/[0.02] ring-1 ring-border-light/60 transition-all hover:shadow-black/[0.04]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="bg-primary text-white flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold shadow-lg shadow-primary/20 -rotate-3">
                    2
                  </div>
                  <div>
                    <h2 className="text-text-dark text-2xl font-bold tracking-tight">
                      Hvordan vil du få maten?
                    </h2>
                    <p className="text-text-muted text-xs font-medium italic opacity-60">Velg leveringsmetode</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, order_type: 'delivery' }))}
                    className={cn(
                      'group relative flex flex-col items-center gap-5 rounded-[2.5rem] border-2 p-8 transition-all duration-300',
                      formData.order_type === 'delivery'
                        ? 'border-primary bg-primary/[0.02] shadow-xl shadow-primary/5 scale-[1.02]'
                        : 'border-border-light/40 text-text-muted bg-white/50 hover:border-primary/20 hover:bg-white'
                    )}
                  >
                    <div className={cn(
                      'rounded-2xl p-4 transition-all duration-300',
                      formData.order_type === 'delivery' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-bg-page text-text-muted'
                    )}>
                      <Truck className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className={cn('block text-sm font-bold tracking-[0.2em] uppercase mb-1', formData.order_type === 'delivery' ? 'text-primary' : '')}>Levering</span>
                      <span className="text-[11px] font-medium opacity-60 italic leading-tight block">Kjøres hjem til deg</span>
                    </div>
                    {formData.order_type === 'delivery' && (
                      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, order_type: 'pickup' }));
                      setFieldErrors(prev => { const n = {...prev}; delete n.customer_address; return n; });
                    }}
                    className={cn(
                      'group relative flex flex-col items-center gap-5 rounded-[2.5rem] border-2 p-8 transition-all duration-300',
                      formData.order_type === 'pickup'
                        ? 'border-primary bg-primary/[0.02] shadow-xl shadow-primary/5 scale-[1.02]'
                        : 'border-border-light/40 text-text-muted bg-white/50 hover:border-primary/20 hover:bg-white'
                    )}
                  >
                    <div className={cn(
                      'rounded-2xl p-4 transition-all duration-300',
                      formData.order_type === 'pickup' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-bg-page text-text-muted'
                    )}>
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className={cn('block text-sm font-bold tracking-[0.2em] uppercase mb-1', formData.order_type === 'pickup' ? 'text-primary' : '')}>Henting</span>
                      <span className="text-[11px] font-medium opacity-60 italic leading-tight block">Du henter selv</span>
                    </div>
                    {formData.order_type === 'pickup' && (
                      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                </div>

                {formData.order_type === 'delivery' && (
                  <div className="mt-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-3">
                      <label htmlFor="customer_address" className="text-text-muted text-[10px] font-bold tracking-[0.15em] uppercase px-1">
                        Leveringsadresse
                      </label>
                      <input
                        type="text"
                        id="customer_address"
                        name="customer_address"
                        value={formData.customer_address}
                        onChange={handleInputChange}
                        placeholder="Gateadresse, postnummer og sted"
                        className={cn(
                          'w-full rounded-2xl border bg-bg-page/50 p-4 shadow-inner transition-all outline-none focus:ring-4',
                          fieldErrors.customer_address
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                            : 'border-border-light/60 focus:ring-primary/5 focus:border-primary'
                        )}
                      />
                      {fieldErrors.customer_address && (
                        <p className="mt-1 text-[10px] font-bold text-red-500 px-1 uppercase tracking-wider">
                          {fieldErrors.customer_address}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Beskjed */}
              <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-black/[0.02] ring-1 ring-border-light/60 transition-all hover:shadow-black/[0.04]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="bg-primary text-white flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold shadow-lg shadow-primary/20 rotate-12">
                    3
                  </div>
                  <div>
                    <h2 className="text-text-dark text-2xl font-bold tracking-tight">
                      Siste detaljer
                    </h2>
                    <p className="text-text-muted text-xs font-medium italic opacity-60">Merknad og betaling</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label htmlFor="comment" className="text-text-muted text-[10px] font-bold tracking-[0.15em] uppercase px-1">
                      Beskjed (valgfri)
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={3}
                      value={formData.comment}
                      onChange={handleInputChange}
                      placeholder="Dørkode, allergier eller andre ønsker..."
                      className="w-full rounded-2xl border border-border-light/60 bg-bg-page/50 p-4 shadow-inner transition-all outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-primary/5 p-8 ring-1 ring-primary/10">
                    <div className="absolute -right-4 -top-4 text-primary opacity-5">
                      <CreditCard className="h-24 w-24 rotate-12" />
                    </div>
                    <div className="relative flex items-start gap-5">
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                        <CreditCard className="text-primary h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-text-dark font-bold leading-none">Betalingsinformasjon</h3>
                        <p className="text-text-muted text-sm leading-relaxed italic opacity-80">
                          Bestillingen betales direkte ved levering/henting. 
                          Vi aksepterer <span className="text-primary font-bold">Kort, Kontant и Vipps.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isClosed && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-4 ring-1 ring-amber-100">
                  <span className="text-2xl">🌙</span>
                  <div className="space-y-1">
                    <p className="text-amber-900 font-bold">Vi har dessverre stengt nå</p>
                    <p className="text-amber-800/80 text-sm font-medium italic">
                      {shopStatus?.message}. Velkommen tilbake ved åpning!
                    </p>
                  </div>
                </div>
              )}

              {generalError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4 ring-1 ring-red-100">
                  <span className="text-xl">⚠️</span>
                  <p className="text-red-900 font-bold">{generalError}</p>
                </div>
              )}
            </form>
          </div>

          {/* Sidebar: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-32">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-black/[0.04] ring-1 ring-border-light/60">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-heading text-text-dark text-4xl font-semibold">Din Bestilling</h2>
                  <div className="bg-bg-page h-10 w-10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="text-primary h-5 w-5" />
                  </div>
                </div>

                <div className="custom-scrollbar mb-10 max-h-[45vh] space-y-6 overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={item.id} className="group flex justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-primary text-sm font-black italic">x{item.quantity}</span>
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
                      <Price amount={item.price * item.quantity} className="text-text-dark font-bold whitespace-nowrap" />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t-2 border-dashed border-border-light/60 pt-8">
                  <div className="flex items-center justify-between opacity-60">
                    <span className="text-[10px] font-bold tracking-widest uppercase">Subtotal</span>
                    <Price amount={totalPrice} className="text-sm font-bold" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">Levering</span>
                    <span className="text-primary text-[10px] font-bold tracking-widest uppercase">Gratis</span>
                  </div>
                  
                  <div className="flex items-end justify-between pt-6">
                    <div>
                      <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase opacity-40 block mb-1">Total å betale</span>
                      <span className="font-heading text-text-dark text-4xl font-semibold leading-none">Total</span>
                    </div>
                    <Price amount={totalPrice} className="text-primary text-4xl leading-none" />
                  </div>
                </div>

                <div className="hidden pt-12 lg:block">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    disabled={isSubmitting || isClosed}
                    className={cn(
                      'w-full rounded-2xl py-7 shadow-2xl text-lg font-bold tracking-[0.1em] transition-all active:scale-95',
                      isClosed
                        ? 'bg-text-muted/20 text-text-muted cursor-not-allowed shadow-none'
                        : 'shadow-primary/30'
                    )}
                  >
                    {isClosed ? 'Vi har stengt' : isSubmitting ? 'Sender bestilling...' : 'Bekreft Bestilling'}
                  </Button>
                </div>

                {/* Mobile CTA - Now moved here after summary */}
                <div className="pt-8 lg:hidden">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    disabled={isSubmitting || isClosed}
                    className={cn(
                      'w-full rounded-2xl py-7 shadow-2xl text-lg tracking-widest transition-all active:scale-95',
                      isClosed
                        ? 'bg-text-muted/20 text-text-muted cursor-not-allowed shadow-none'
                        : 'shadow-primary/30'
                    )}
                  >
                    {isClosed ? 'Vi har stengt' : isSubmitting ? 'Behandler...' : `Fullfør Bestilling — ${totalPrice},-`}
                  </Button>
                </div>

                <div className="mt-10 pt-10 border-t border-border-light/40">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] font-bold tracking-widest uppercase opacity-30 mb-2">Vipps</span>
                       <div className="h-8 w-12 bg-bg-page rounded flex items-center justify-center opacity-40 grayscale group-hover:grayscale-0 transition-all">
                          <span className="text-xs font-black">V</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] font-bold tracking-widest uppercase opacity-30 mb-2">Kort</span>
                       <div className="h-8 w-12 bg-bg-page rounded flex items-center justify-center opacity-40 grayscale transition-all">
                          <CreditCard className="h-4 w-4" />
                       </div>
                    </div>
                  </div>
                  <p className="mt-8 text-center text-text-muted text-[10px] leading-relaxed font-bold tracking-wider uppercase italic opacity-40">
                    Spørsmål? Ring oss: {settings?.phone || '90 89 77 77'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
