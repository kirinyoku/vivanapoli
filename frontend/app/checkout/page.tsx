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
  const [isManualClosed, setIsManualClosed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    api.getSettings().then(settings => {
      setIsManualClosed((settings as any).is_open === 'false');
    }).catch(err => console.error("Failed to load settings:", err));
  }, []);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    order_type: 'delivery' as OrderType,
    comment: '',
  });

  const shopStatus = mounted ? getShopStatus(isManualClosed) : null;
  const isClosed = shopStatus?.status === 'closed';

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Laster...</div>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-bg-page">
        <div className="mb-6 rounded-full bg-white p-8 shadow-sm">
          <ShoppingBag className="h-16 w-16 text-text-muted opacity-20" />
        </div>
        <h1 className="mb-2 font-heading text-3xl font-semibold text-text-dark">
          Kurven er tom
        </h1>
        <p className="mb-8 text-text-muted italic max-w-md">
          Du har ingen varer i kurven. Gå tilbake til menyen for å legge til noe godt.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-2xl px-12">Se menyen</Button>
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
      errors.customer_phone = 'Vennligst oppgi et gyldig telefonnummer (8 siffer)';
    }
    
    if (formData.order_type === 'delivery' && !formData.customer_address.trim()) {
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
    <div className="min-h-screen bg-bg-page flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border-light bg-white px-4 py-4 md:px-6 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-muted hover:text-text-dark transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-white group-hover:border-text-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline font-bold uppercase tracking-wider text-xs">Meny</span>
          </Link>
          <div className="font-heading text-3xl font-semibold text-text-dark">
            Viva<span className="text-primary">Napoli</span>
          </div>
          <div className="w-10 sm:w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6 md:py-12 flex-grow">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 items-start">
          {/* Form Section */}
          <div className="lg:col-span-3 space-y-12">
            <div>
              <h1 className="mb-4 font-heading text-5xl font-semibold text-text-dark">
                Din Bestilling
              </h1>
              <p className="text-text-muted italic">Vennligst oppgi informasjon for å fullføре bestillingen.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                  <h2 className="text-2xl font-bold text-text-dark">Kontaktinfo</h2>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label
                      htmlFor="customer_name"
                      className="text-xs font-bold text-text-muted uppercase tracking-[0.15em]"
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
                        "w-full rounded-2xl border bg-white p-4 outline-none focus:ring-4 transition-all shadow-sm",
                        fieldErrors.customer_name 
                          ? "border-red-500 focus:ring-red-500/5 focus:border-red-500" 
                          : "border-border-light focus:ring-primary/5 focus:border-primary"
                      )}
                    />
                    {fieldErrors.customer_name && (
                      <p className="text-xs font-bold text-red-500 mt-1">{fieldErrors.customer_name}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label
                      htmlFor="customer_phone"
                      className="text-xs font-bold text-text-muted uppercase tracking-[0.15em]"
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
                        "w-full rounded-2xl border bg-white p-4 outline-none focus:ring-4 transition-all shadow-sm",
                        fieldErrors.customer_phone 
                          ? "border-red-500 focus:ring-red-500/5 focus:border-red-500" 
                          : "border-border-light focus:ring-primary/5 focus:border-primary"
                      )}
                    />
                    {fieldErrors.customer_phone && (
                      <p className="text-xs font-bold text-red-500 mt-1">{fieldErrors.customer_phone}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                  <h2 className="text-2xl font-bold text-text-dark">Levering eller henting?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, order_type: 'delivery' }));
                      if (fieldErrors.customer_address) {
                        setFieldErrors(prev => {
                          const newErrors = {...prev};
                          delete newErrors.customer_address;
                          return newErrors;
                        });
                      }
                    }}
                    className={cn(
                      'flex flex-col items-center gap-4 rounded-3xl border-2 p-8 transition-all relative overflow-hidden group',
                      formData.order_type === 'delivery'
                        ? 'border-primary bg-white shadow-xl shadow-primary/10'
                        : 'border-border-light bg-white/50 text-text-muted hover:border-text-muted/30'
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl transition-colors",
                      formData.order_type === 'delivery' ? 'bg-primary text-white' : 'bg-black/5 text-text-muted group-hover:bg-black/10'
                    )}>
                      <Truck className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className={cn("block font-bold uppercase tracking-widest text-sm mb-1", formData.order_type === 'delivery' ? 'text-primary' : '')}>Levering</span>
                      <span className="text-xs opacity-60">Vi leverer hjem til deg</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, order_type: 'pickup' }));
                      setFieldErrors(prev => {
                        const newErrors = {...prev};
                        delete newErrors.customer_address;
                        return newErrors;
                      });
                    }}
                    className={cn(
                      'flex flex-col items-center gap-4 rounded-3xl border-2 p-8 transition-all relative overflow-hidden group',
                      formData.order_type === 'pickup'
                        ? 'border-primary bg-white shadow-xl shadow-primary/10'
                        : 'border-border-light bg-white/50 text-text-muted hover:border-text-muted/30'
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl transition-colors",
                      formData.order_type === 'pickup' ? 'bg-primary text-white' : 'bg-black/5 text-text-muted group-hover:bg-black/10'
                    )}>
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className={cn("block font-bold uppercase tracking-widest text-sm mb-1", formData.order_type === 'pickup' ? 'text-primary' : '')}>Henting</span>
                      <span className="text-xs opacity-60">Hentes hos oss i restauranten</span>
                    </div>
                  </button>
                </div>

                {formData.order_type === 'delivery' && (
                  <div className="space-y-3 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <label
                      htmlFor="customer_address"
                      className="text-xs font-bold text-text-muted uppercase tracking-[0.15em]"
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
                        "w-full rounded-2xl border bg-white p-4 outline-none focus:ring-4 transition-all shadow-sm",
                        fieldErrors.customer_address 
                          ? "border-red-500 focus:ring-red-500/5 focus:border-red-500" 
                          : "border-border-light focus:ring-primary/5 focus:border-primary"
                      )}
                    />
                    {fieldErrors.customer_address && (
                      <p className="text-xs font-bold text-red-500 mt-1">{fieldErrors.customer_address}</p>
                    )}
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                  <h2 className="text-2xl font-bold text-text-dark">Merknad & Betaling</h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label
                      htmlFor="comment"
                      className="text-xs font-bold text-text-muted uppercase tracking-[0.15em]"
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
                      className="w-full resize-none rounded-2xl border border-border-light bg-white p-4 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
                    />
                  </div>

                  <div className="rounded-2xl border-2 border-dashed border-border-light p-8 text-center bg-white/30 group hover:border-primary/30 transition-colors">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-text-muted mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-text-dark mb-1">Betaling</h3>
                    <p className="text-sm text-text-muted italic">
                      Varene betales direkte til oss ved levering eller henting. 
                      Vi tar Kort, Kontant og Vipps.
                    </p>
                  </div>
                </div>
              </section>

              {isClosed && (
                <div className="rounded-2xl bg-amber-50 p-6 text-sm font-bold text-amber-700 border border-amber-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <span className="text-xl">🌙</span>
                  <div>
                    <p>{shopStatus?.message}</p>
                    <p className="font-normal opacity-80 mt-1">Vi tar dessverre ikke imot bestillinger akkurat nå. Velkommen tilbake ved åpning!</p>
                  </div>
                </div>
              )}

              {generalError && (
                <div className="rounded-2xl bg-red-50 p-6 text-sm font-bold text-red-600 border border-red-100 animate-pulse">
                  ⚠️ {generalError}
                </div>
              )}

              <div className="lg:hidden pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || isClosed}
                  className={cn(
                    "w-full rounded-2xl py-6 shadow-2xl transition-all active:scale-95",
                    isClosed ? "bg-text-muted/20 text-text-muted cursor-not-allowed shadow-none" : "shadow-primary/30"
                  )}
                >
                  {isClosed ? 'Vi har stengt' : (isSubmitting ? 'Behandler...' : `Bekreft Bestilling — ${totalPrice},-`)}
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-32">
              <div className="rounded-[40px] border border-border-light bg-white p-10 shadow-xl shadow-black/[0.03]">
                <h2 className="mb-8 font-heading text-3xl font-semibold text-text-dark">
                  Din Bestilling
                </h2>

                <div className="mb-10 space-y-6 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4 group">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-dark leading-tight group-hover:text-primary transition-colors">
                          {item.quantity}x {item.name}
                        </span>
                        {item.size && (
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1">
                            {item.size === 'large' ? 'Stor' : 'Liten'}
                          </span>
                        )}
                      </div>
                      <Price amount={item.price * item.quantity} className="text-base font-bold text-text-dark whitespace-nowrap" />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t-2 border-border-light pt-8">
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                    <Price amount={totalPrice} className="text-sm font-bold" />
                  </div>
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="text-xs font-bold uppercase tracking-widest">Levering</span>
                    {formData.order_type === 'delivery' ? (
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Gratis</span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-widest">—</span>
                    )}
                  </div>
                  <div className="flex justify-between items-end pt-4">
                    <span className="font-heading text-2xl font-semibold text-text-dark">Totalt</span>
                    <Price amount={totalPrice} className="text-3xl text-primary" />
                  </div>
                </div>

                <div className="hidden lg:block pt-10">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    disabled={isSubmitting || isClosed}
                    className={cn(
                      "w-full rounded-2xl py-6 shadow-2xl transition-all active:scale-95",
                      isClosed ? "bg-text-muted/20 text-text-muted cursor-not-allowed shadow-none" : "shadow-primary/30"
                    )}
                  >
                    {isClosed ? 'Vi har stengt' : (isSubmitting ? 'Behandler...' : 'Send Bestilling')}
                  </Button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-text-muted opacity-40">
                  <div className="h-px flex-grow bg-current"></div>
                  <ShoppingBag className="h-4 w-4" />
                  <div className="h-px flex-grow bg-current"></div>
                </div>
                
                <p className="mt-6 text-center text-[10px] text-text-muted italic leading-relaxed uppercase tracking-wider font-bold opacity-60">
                  Ring oss på 90 89 77 77 om du har spørsmål
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
