'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { RestaurantSettings } from '@/types';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Power } from 'lucide-react';

/**
 * Settings page for the admin panel.
 *
 * Allows administrators to update restaurant settings: address, phone, opening
 * hours, delivery time, minimum order price, and manual open/close status.
 * Time slots are generated dynamically in 30‑minute increments (00:00–23:30).
 *
 * The page uses a controlled form pattern: changes are only saved when the user
 * explicitly clicks "Lagre innstillinger".
 */
export default function SettingsPage() {
  const { handleApiError } = useAdminAuth();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate time slots (00:00 to 23:30)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
      .toString()
      .padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        // Ensure all fields have values
        const normalizedData: RestaurantSettings = {
          address: data?.address || '',
          phone: data?.phone || '',
          open_time: data?.open_time || '14:00',
          close_time: data?.close_time || '22:00',
          delivery_time: data?.delivery_time || '',
          min_order_price: data?.min_order_price || '0',
          is_open: data?.is_open || 'true',
        };
        setSettings(normalizedData);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      // Validation: Required fields
      if (!settings.address?.trim()) {
        setError('Adresse er påkrevd');
        setSaving(false);
        return;
      }

      if (!settings.phone?.trim()) {
        setError('Telefonnummer er påkrevd');
        setSaving(false);
        return;
      }

      if (!settings.delivery_time?.trim()) {
        setError('Leveringstid er påkrevd');
        setSaving(false);
        return;
      }

      // Validation: Minimum order price
      const minPrice = parseInt(settings.min_order_price);
      if (isNaN(minPrice) || minPrice < 0) {
        setError('Minste bestilling kan ikke være et negativt tall');
        setSaving(false);
        return;
      }

      // Validation: Opening hours logic
      const [openH, openM] = settings.open_time.split(':').map(Number);
      const [closeH, closeM] = settings.close_time.split(':').map(Number);
      const openMins = openH * 60 + openM;
      const closeMins = closeH * 60 + closeM;

      if (openMins >= closeMins) {
        setError('Stengetid må være etter åpningstid');
        setSaving(false);
        return;
      }

      // All validations passed - update settings
      const updatePayload: Record<string, string> = {
        address: settings.address,
        phone: settings.phone,
        open_time: settings.open_time,
        close_time: settings.close_time,
        delivery_time: settings.delivery_time,
        min_order_price: settings.min_order_price,
        is_open: settings.is_open,
      };
      await api.updateSettings(updatePayload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Kunne ikke lagre innstillinger';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;

    if (name && value !== undefined) {
      setSettings((prev) => {
        if (!prev) return null;
        return { ...prev, [name]: value };
      });
    }
  };

  if (loading)
    return <div className="p-8 text-center">Laster innstillinger...</div>;
  if (!settings)
    return (
      <div className="p-8 text-center text-red-600">
        Feil ved lasting av data
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="font-heading text-text-dark text-4xl font-bold tracking-tight">
          Innstillinger
        </h1>
        <p className="text-text-muted italic opacity-70">
          Administrer restaurantens profil og driftsparametere.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xl font-bold text-red-600 shadow-sm">
              !
            </div>
            <p className="text-sm font-bold tracking-wider text-red-900 uppercase">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-5 duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xl font-bold text-green-600 shadow-sm">
              ✓
            </div>
            <p className="text-sm font-bold tracking-wider text-green-900 uppercase">
              Innstillingene ble lagret!
            </p>
          </div>
        )}

        <div className="ring-border-light/60 space-y-10 rounded-3xl bg-white p-8 shadow-xl ring-1 shadow-black/[0.02] md:p-10">
          {/* Section: Kontaktinfo */}
          <section className="space-y-6">
            <div className="mb-8 flex items-center gap-3">
              <div className="bg-accent-gold h-1 w-10 rounded-full" />
              <h2 className="text-text-dark text-xl font-bold tracking-tight">
                Kontaktinformasjon
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-3 sm:col-span-2">
                <label className="text-text-muted px-1 text-[10px] font-black tracking-[0.15em] uppercase opacity-60">
                  Adresse
                </label>
                <input
                  type="text"
                  name="address"
                  className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4"
                  value={settings.address || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-3">
                <label className="text-text-muted px-1 text-[10px] font-black tracking-[0.15em] uppercase opacity-60">
                  Telefon
                </label>
                <input
                  type="text"
                  name="phone"
                  className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4"
                  value={settings.phone || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-3">
                <label className="text-text-muted px-1 text-[10px] font-black tracking-[0.15em] uppercase opacity-60">
                  Leveringstid (estimert)
                </label>
                <input
                  type="text"
                  name="delivery_time"
                  placeholder="f.eks. 30-60 min"
                  className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4"
                  value={settings.delivery_time || ''}
                  onChange={handleChange}
                />
                <p className="text-text-muted px-1 text-[9px] font-bold tracking-widest uppercase italic opacity-40">
                  Vises på forsiden og kvittering
                </p>
              </div>
            </div>
          </section>

          {/* Section: Drift */}
          <section className="border-border-light/40 space-y-6 border-t pt-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="bg-accent-gold h-1 w-10 rounded-full" />
              <h2 className="text-text-dark text-xl font-bold tracking-tight">
                Drift & Åpningstider
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <label className="text-text-muted px-1 text-[10px] font-black tracking-[0.15em] uppercase opacity-60">
                  Åpningstid
                </label>
                <select
                  name="open_time"
                  className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full cursor-pointer appearance-none rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4"
                  value={settings.open_time || '14:00'}
                  onChange={handleChange}
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-text-muted px-1 text-[10px] font-black tracking-[0.15em] uppercase opacity-60">
                  Stengetid
                </label>
                <select
                  name="close_time"
                  className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full cursor-pointer appearance-none rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4"
                  value={settings.close_time || '22:00'}
                  onChange={handleChange}
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-text-muted px-1 text-[10px] font-black tracking-[0.15em] uppercase opacity-60">
                  Minste bestilling (NOK)
                </label>
                <input
                  type="number"
                  name="min_order_price"
                  min="0"
                  className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full rounded-2xl border p-4 shadow-inner transition-all outline-none focus:ring-4"
                  value={settings.min_order_price || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* Section: Status */}
          <section className="border-border-light/40 border-t pt-10">
            <div
              className={cn(
                'flex flex-col items-center justify-between gap-6 rounded-[2rem] p-8 transition-all duration-500 sm:flex-row',
                settings.is_open === 'false'
                  ? 'bg-red-50 ring-1 ring-red-100'
                  : 'bg-bg-page ring-border-light/40 ring-1'
              )}
            >
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-colors',
                    settings.is_open === 'false'
                      ? 'bg-white text-red-600 shadow-red-200/50'
                      : 'bg-white text-gray-400 shadow-black/[0.02]'
                  )}
                >
                  <Power size={28} />
                </div>
                <div>
                  <h3
                    className={cn(
                      'mb-1 text-xs font-black tracking-widest uppercase',
                      settings.is_open === 'false'
                        ? 'text-red-700'
                        : 'text-text-dark'
                    )}
                  >
                    Manuell stenging
                  </h3>
                  <p className="max-w-xs text-[11px] leading-snug font-medium italic opacity-60">
                    Overstyr åpningstidene og steng butikken umiddelbart for
                    alle bestillinger.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          is_open: prev.is_open === 'false' ? 'true' : 'false',
                        }
                      : null
                  )
                }
                className={cn(
                  'relative inline-flex h-10 w-20 flex-shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-all duration-300 ease-in-out outline-none',
                  settings.is_open === 'false' ? 'bg-red-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out',
                    settings.is_open === 'false'
                      ? 'translate-x-10'
                      : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </section>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="shadow-primary/20 rounded-2xl px-12 py-6 text-lg font-bold tracking-widest uppercase shadow-xl transition-all active:scale-95"
          >
            {saving ? 'Lagrer...' : 'Lagre innstillinger'}
          </Button>
        </div>
      </form>
    </div>
  );
}
