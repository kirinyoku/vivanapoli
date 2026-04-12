'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { RestaurantSettings } from '@/types';
import Button from '@/components/ui/Button';

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Restaurantinnstillinger
        </h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                Innstillingene ble lagret!
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block cursor-default text-sm font-medium text-gray-700">
                  Adresse
                </label>
                <input
                  type="text"
                  name="address"
                  className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                  value={settings.address || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block cursor-default text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <input
                  type="text"
                  name="phone"
                  className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                  value={settings.phone || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block cursor-default text-sm font-medium text-gray-700">
                  Leveringstid (estimert)
                </label>
                <input
                  type="text"
                  name="delivery_time"
                  placeholder="f.eks. 30-60 min"
                  className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                  value={settings.delivery_time || ''}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Vises på forsiden, f.eks: "30-45 min" или "ca. 1 time"
                </p>
              </div>

              <div>
                <label className="block cursor-default text-sm font-medium text-gray-700">
                  Åpningstid
                </label>
                <select
                  name="open_time"
                  className="mt-1 block w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
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

              <div>
                <label className="block cursor-default text-sm font-medium text-gray-700">
                  Stengetid
                </label>
                <select
                  name="close_time"
                  className="mt-1 block w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
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

              <div>
                <label className="block cursor-default text-sm font-medium text-gray-700">
                  Minste bestilling (NOK)
                </label>
                <input
                  type="number"
                  name="min_order_price"
                  min="0"
                  className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                  value={settings.min_order_price || ''}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Knappen "Gå til kassen" blir deaktivert under denne summen
                </p>
              </div>

              <div className="rounded-lg border border-red-100 bg-red-50 p-4 md:col-span-2">
                <h3 className="mb-2 text-sm font-bold tracking-wider text-red-800 uppercase">
                  Hastesituasjon
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Manuell stenging
                    </p>
                    <p className="text-xs text-red-700">
                      Steng butikken umiddelbart for alle bestillinger,
                      uavhengig av åpningstider.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              is_open:
                                prev.is_open === 'false' ? 'true' : 'false',
                            }
                          : null
                      )
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none ${
                      settings.is_open === 'false'
                        ? 'bg-red-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.is_open === 'false'
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
            <Button type="submit" disabled={saving}>
              {saving ? 'Lagrer...' : 'Lagre endringer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
